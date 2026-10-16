import { FLEX_POSITIONS } from "./constants";
import { getLeaguePowerScores, getTeamPositionStrength } from "./data";
import type { League, PositionAxisRank, RosterPlayer, Team, WeeklyPoints } from "./types";

// Trade Analyzer math. Everything here is pure: it builds "before" and
// "after" copies of the league and runs the same ranking functions the
// Compare page uses on both, so a trade is judged on exactly the same
// terms as everything else in the app.
//
// Both copies re-set every team's lineup to its best possible one (by
// projected points) rather than keeping whatever lineup the manager has
// set right now -- otherwise a trade's effect would be mixed up with
// lineup mistakes or stale lineups, and before/after wouldn't be
// apples-to-apples.
//
// "season" mode values players on projectedPoints, which is ESPN's
// rest-of-season projection (remaining weeks only, not the full season).
// "week" mode uses this week's projections.

export type TradeMode = "season" | "week";

export interface TradeProposal {
  teamAId: number;
  teamBId: number;
  aSends: number[]; // player ids moving from A to B
  bSends: number[]; // player ids moving from B to A
}

export interface TradeModeResult {
  lineupBefore: number; // best possible starters' projected total
  lineupAfter: number;
  axesBefore: PositionAxisRank[];
  axesAfter: PositionAxisRank[];
  powerBefore: number;
  powerAfter: number;
  rankBefore: number; // power ranking, 1 = best
  rankAfter: number;
  startersAfter: RosterPlayer[];
}

export interface TradeTeamResult {
  teamId: number;
  teamName: string;
  sent: RosterPlayer[];
  received: RosterPlayer[];
  // Roster-size fallout: a team receiving more players than it sends
  // drops its lowest-projected bench players; a team receiving fewer
  // fills the open spots with the best available free agents.
  dropped: RosterPlayer[];
  pickedUp: RosterPlayer[];
  modes: Record<TradeMode, TradeModeResult>;
}

export interface TradeResult {
  teams: [TradeTeamResult, TradeTeamResult];
  weeksRemaining: number; // weeks covered by the rest-of-season projection
}

type ValueFn = (p: RosterPlayer) => number;

function valueFnFor(mode: TradeMode, weekly: Map<number, WeeklyPoints>): ValueFn {
  return mode === "season"
    ? (p) => p.projectedPoints
    : (p) => weekly.get(p.playerId)?.projected ?? 0;
}

// Players ruled out (out, on IR, suspended) only start in a best lineup
// when no healthy player can fill the slot. Questionable and doubtful
// players still count until they're ruled out.
export const UNAVAILABLE_STATUSES = new Set(["O", "IR", "SUSP"]);

export function isUnavailable(p: RosterPlayer): boolean {
  return UNAVAILABLE_STATUSES.has(p.injuryStatus);
}

/**
 * Returns the roster with every non-IR player re-slotted into the best
 * possible lineup for `value`: each fixed slot (QB, RB, WR, ...) takes
 * the highest-valued available players at that position, then FLEX takes
 * the best remaining RB/WR/TE. Everyone else goes to the bench. Filling
 * the fixed slots first and FLEX last is optimal for this kind of
 * lineup. Unavailable players (see UNAVAILABLE_STATUSES) are only used
 * when nobody else is eligible for the slot.
 */
export function optimizeLineup(
  roster: RosterPlayer[],
  slotCounts: Record<string, number>,
  value: ValueFn
): RosterPlayer[] {
  const slotById = new Map<number, string>();
  const byValue = [...roster]
    .filter((p) => p.lineupSlot !== "IR")
    .sort((a, b) => Number(isUnavailable(a)) - Number(isUnavailable(b)) || value(b) - value(a));

  for (const [slot, count] of Object.entries(slotCounts)) {
    if (slot === "FLEX") continue;
    byValue
      .filter((p) => p.position === slot && !slotById.has(p.playerId))
      .slice(0, count)
      .forEach((p) => slotById.set(p.playerId, slot));
  }
  byValue
    .filter((p) => FLEX_POSITIONS.includes(p.position) && !slotById.has(p.playerId))
    .slice(0, slotCounts.FLEX ?? 0)
    .forEach((p) => slotById.set(p.playerId, "FLEX"));

  return roster.map((p) =>
    p.lineupSlot === "IR" ? p : { ...p, lineupSlot: slotById.get(p.playerId) ?? "Bench" }
  );
}

function withOptimizedLineups(league: League, value: ValueFn): League {
  return {
    ...league,
    teams: league.teams.map((t) => ({
      ...t,
      roster: optimizeLineup(t.roster, league.lineupSlotCounts, value),
    })),
  };
}

function starterTotal(team: Team, value: ValueFn): number {
  const total = team.roster
    .filter((p) => p.lineupSlot !== "Bench" && p.lineupSlot !== "IR")
    .reduce((sum, p) => sum + value(p), 0);
  return Math.round(total * 10) / 10;
}

function powerRanks(scores: Map<number, number>): Map<number, number> {
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  return new Map(ranked.map(([teamId], i) => [teamId, i + 1]));
}

/**
 * Applies the trade to a copy of the league: swaps the players, then
 * evens out roster sizes (drops for a team over the limit, free-agent
 * pickups for a team with open spots). Drops and pickups are chosen on
 * rest-of-season value in both modes, since that's how a manager would
 * actually decide who to cut or claim.
 */
function applyTrade(
  league: League,
  trade: TradeProposal,
  freeAgents: RosterPlayer[]
): { league: League; dropped: Map<number, RosterPlayer[]>; pickedUp: Map<number, RosterPlayer[]> } {
  const teamA = league.teams.find((t) => t.id === trade.teamAId)!;
  const teamB = league.teams.find((t) => t.id === trade.teamBId)!;
  const moving = (team: Team, ids: number[]) => team.roster.filter((p) => ids.includes(p.playerId));
  const fromA = moving(teamA, trade.aSends);
  const fromB = moving(teamB, trade.bSends);

  const dropped = new Map<number, RosterPlayer[]>();
  const pickedUp = new Map<number, RosterPlayer[]>();
  const available = [...freeAgents];

  const rosValue: ValueFn = (p) => p.projectedPoints;
  const lineupTotal = (roster: RosterPlayer[]) =>
    starterTotal(
      { roster: optimizeLineup(roster, league.lineupSlotCounts, rosValue) } as Team,
      rosValue
    );

  // Picks the roster move that's best for the lineup, one at a time:
  // drop whoever costs the best lineup the least (a bench player costs
  // nothing -- then the lowest projection goes), and add whichever free
  // agent helps it most (then the highest projection). Without this, the
  // lowest-projected player overall could be a team's only QB.
  function bestBy(
    candidates: RosterPlayer[],
    score: (p: RosterPlayer) => number,
    tiebreak: (p: RosterPlayer) => number
  ): RosterPlayer {
    return candidates.reduce((best, p) =>
      score(p) > score(best) + 0.05 ||
      (Math.abs(score(p) - score(best)) <= 0.05 && tiebreak(p) > tiebreak(best))
        ? p
        : best
    );
  }

  function rebuild(team: Team, sends: RosterPlayer[], gets: RosterPlayer[]): Team {
    const incoming = gets.map((p) => ({ ...p, lineupSlot: "Bench" }));
    let roster = [...team.roster.filter((p) => !sends.includes(p)), ...incoming];
    const activeCount = () => roster.filter((p) => p.lineupSlot !== "IR").length;
    const cuts: RosterPlayer[] = [];
    const adds: RosterPlayer[] = [];

    while (activeCount() > league.rosterSize) {
      // Never cut a player the team just traded for.
      const candidates = roster.filter((p) => p.lineupSlot !== "IR" && !incoming.includes(p));
      const cut = bestBy(
        candidates,
        (p) => lineupTotal(roster.filter((x) => x !== p)),
        (p) => -p.projectedPoints
      );
      roster = roster.filter((p) => p !== cut);
      cuts.push(cut);
    }
    // Only fill spots this trade opened up, not ones already empty.
    let openSpots = Math.min(sends.length - gets.length, league.rosterSize - activeCount());
    while (openSpots-- > 0 && available.length > 0) {
      const add = bestBy(
        available,
        (p) => lineupTotal([...roster, { ...p, lineupSlot: "Bench" }]),
        (p) => p.projectedPoints
      );
      available.splice(available.indexOf(add), 1);
      roster = [...roster, { ...add, lineupSlot: "Bench" }];
      adds.push(add);
    }

    if (cuts.length) dropped.set(team.id, cuts);
    if (adds.length) pickedUp.set(team.id, adds);
    return { ...team, roster };
  }

  const newA = rebuild(teamA, fromA, fromB);
  const newB = rebuild(teamB, fromB, fromA);
  return {
    league: {
      ...league,
      teams: league.teams.map((t) => (t.id === newA.id ? newA : t.id === newB.id ? newB : t)),
    },
    dropped,
    pickedUp,
  };
}

/**
 * Evaluates a trade for both teams, in both modes. `weekly` must cover
 * this week's projections for every rostered player plus `freeAgents`
 * (for "week" mode); `freeAgents` only matters when the trade is
 * uneven (e.g. 2-for-1).
 */
export function evaluateTrade(
  league: League,
  trade: TradeProposal,
  weekly: Map<number, WeeklyPoints>,
  freeAgents: RosterPlayer[]
): TradeResult {
  const { league: traded, dropped, pickedUp } = applyTrade(league, trade, freeAgents);

  const perMode = {} as Record<TradeMode, { before: League; after: League; value: ValueFn }>;
  for (const mode of ["season", "week"] as const) {
    const value = valueFnFor(mode, weekly);
    perMode[mode] = {
      before: withOptimizedLineups(league, value),
      after: withOptimizedLineups(traded, value),
      value,
    };
  }

  const powerFor = (l: League, mode: TradeMode) =>
    getLeaguePowerScores(l, mode === "season" ? "season" : l.currentWeek, weekly);

  function resultFor(teamId: number, sends: number[], gets: number[]): TradeTeamResult {
    const original = league.teams.find((t) => t.id === teamId)!;
    const otherId = teamId === trade.teamAId ? trade.teamBId : trade.teamAId;
    const other = league.teams.find((t) => t.id === otherId)!;

    const modes = {} as Record<TradeMode, TradeModeResult>;
    for (const mode of ["season", "week"] as const) {
      const { before, after, value } = perMode[mode];
      const week = mode === "season" ? "season" : league.currentWeek;
      const teamBefore = before.teams.find((t) => t.id === teamId)!;
      const teamAfter = after.teams.find((t) => t.id === teamId)!;
      const scoresBefore = powerFor(before, mode);
      const scoresAfter = powerFor(after, mode);
      modes[mode] = {
        lineupBefore: starterTotal(teamBefore, value),
        lineupAfter: starterTotal(teamAfter, value),
        axesBefore: getTeamPositionStrength(before, teamId, week, weekly).axes,
        axesAfter: getTeamPositionStrength(after, teamId, week, weekly).axes,
        powerBefore: scoresBefore.get(teamId) ?? 0,
        powerAfter: scoresAfter.get(teamId) ?? 0,
        rankBefore: powerRanks(scoresBefore).get(teamId) ?? 0,
        rankAfter: powerRanks(scoresAfter).get(teamId) ?? 0,
        startersAfter: teamAfter.roster.filter(
          (p) => p.lineupSlot !== "Bench" && p.lineupSlot !== "IR"
        ),
      };
    }

    return {
      teamId,
      teamName: original.name,
      sent: original.roster.filter((p) => sends.includes(p.playerId)),
      received: other.roster.filter((p) => gets.includes(p.playerId)),
      dropped: dropped.get(teamId) ?? [],
      pickedUp: pickedUp.get(teamId) ?? [],
      modes,
    };
  }

  return {
    teams: [
      resultFor(trade.teamAId, trade.aSends, trade.bSends),
      resultFor(trade.teamBId, trade.bSends, trade.aSends),
    ],
    weeksRemaining: Math.max(1, league.totalWeeks - league.currentWeek + 1),
  };
}
