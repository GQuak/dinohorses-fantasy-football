import { FLEX_POSITIONS } from "./constants";
import { getTeamPositionStrength } from "./data";
import { isUnavailable, optimizeLineup } from "./trade";
import type { League, RosterPlayer, Team } from "./types";

// Trade needs, surplus and partner suggestions. Like the Trade Analyzer,
// everything is judged on each team's best possible lineup by
// rest-of-season projection (projectedPoints -- whichever source the
// caller swapped in), not the lineup the manager has set.
//
// Kickers and defenses are left out of needs, surplus and suggested
// trades: they're usually streamed off waivers, not traded for.

// Positions that can be needs. FLEX is a need when the team's best
// non-starting RB/WR/TE ranks poorly against other teams' FLEX.
const NEED_AXES = ["QB", "RB", "WR", "TE", "FLEX"];
const TRADEABLE_POSITIONS = new Set(["QB", "RB", "WR", "TE"]);
// A bench player is surplus when he'd start for at least this many other
// teams -- valuable to them, free for this team to give up.
const SURPLUS_MIN_TEAMS = 3;
// Suggested trades must gain each team at least this much per week, so
// "both teams improve by 0.1" doesn't count as a fit.
const MIN_WEEKLY_GAIN = 0.3;

export interface PositionNeed {
  axis: string;
  rank: number;
  totalTeams: number;
  starters: RosterPlayer[]; // the team's current best starters there
  // Players ruled out (out/IR/suspended) who'd start there if healthy.
  injured: RosterPlayer[];
}

export interface SurplusPlayer {
  player: RosterPlayer;
  startsFor: number; // how many other teams he'd start for
  otherTeams: number;
}

export interface TeamNeeds {
  teamId: number;
  teamName: string;
  needs: PositionNeed[];
  surplus: SurplusPlayer[];
}

export interface SuggestedTrade {
  partnerId: number;
  partnerName: string;
  gives: RosterPlayer[]; // from the team we're finding partners for
  gets: RosterPlayer[];
  gainPerWeek: number; // this team's best-lineup change, pts/week
  partnerGainPerWeek: number;
  // Which of this team's needs the partner's surplus covers, and vice versa.
  coversNeeds: string[];
  partnerCoversNeeds: string[];
}

const projection = (p: RosterPlayer) => p.projectedPoints;
const isStarter = (p: RosterPlayer) => p.lineupSlot !== "Bench" && p.lineupSlot !== "IR";

function optimized(league: League): League {
  return {
    ...league,
    teams: league.teams.map((t) => ({
      ...t,
      roster: optimizeLineup(t.roster, league.lineupSlotCounts, projection),
    })),
  };
}

function lineupTotal(roster: RosterPlayer[], league: League): number {
  return optimizeLineup(roster, league.lineupSlotCounts, projection)
    .filter(isStarter)
    .reduce((sum, p) => sum + p.projectedPoints, 0);
}

// The lowest projection among a team's starters in the slots `player`
// could fill (his position, plus FLEX for RB/WR/TE) -- beat it and he
// starts for them.
function weakestStarterFor(team: Team, player: RosterPlayer): number {
  const slots = new Set([player.position]);
  if (FLEX_POSITIONS.includes(player.position)) slots.add("FLEX");
  const values = team.roster.filter((p) => slots.has(p.lineupSlot)).map(projection);
  return values.length ? Math.min(...values) : 0;
}

// Does `need` (an axis) get filled by a player at `position`?
function fills(need: string, position: string): boolean {
  return need === position || (need === "FLEX" && FLEX_POSITIONS.includes(position));
}

/** Needs and surplus for every team in the league. */
export function getLeagueNeeds(league: League): Map<number, TeamNeeds> {
  const best = optimized(league);
  const total = best.teams.length;
  const result = new Map<number, TeamNeeds>();

  for (const team of best.teams) {
    const { axes } = getTeamPositionStrength(best, team.id, "season", null);
    const needs: PositionNeed[] = [];
    for (const axis of axes) {
      if (!NEED_AXES.includes(axis.axis)) continue;
      const starters = team.roster.filter((p) => p.lineupSlot === axis.axis);
      // Ruled-out players only start when there's no healthy backup (see
      // optimizeLineup); either way, flag one who's starting here or who'd
      // outscore a starter here if healthy.
      const weakest = Math.min(...starters.map(projection));
      const injured = team.roster.filter(
        (p) =>
          isUnavailable(p) &&
          (starters.includes(p) || (fills(axis.axis, p.position) && p.projectedPoints > weakest))
      );
      // Bottom third of the league (#8-#10 of 10), or a starter is missing.
      if (axis.starterRank > Math.ceil((total * 2) / 3) || injured.length > 0) {
        needs.push({ axis: axis.axis, rank: axis.starterRank, totalTeams: total, starters, injured });
      }
    }

    const others = best.teams.filter((t) => t.id !== team.id);
    const surplus = team.roster
      .filter(
        (p) => p.lineupSlot === "Bench" && TRADEABLE_POSITIONS.has(p.position) && !isUnavailable(p)
      )
      .map((player) => ({
        player,
        startsFor: others.filter((t) => player.projectedPoints > weakestStarterFor(t, player)).length,
        otherTeams: others.length,
      }))
      .filter((s) => s.startsFor >= SURPLUS_MIN_TEAMS)
      .sort((a, b) => b.player.projectedPoints - a.player.projectedPoints);

    result.set(team.id, { teamId: team.id, teamName: team.name, needs, surplus });
  }
  return result;
}

/**
 * Teams whose surplus covers this team's needs and vice versa, best
 * mutual fit first -- the team page's "best fits", no trade math.
 */
export function getBestFits(
  needs: Map<number, TeamNeeds>,
  teamId: number
): { teamId: number; teamName: string; theyCover: string[]; youCover: string[] }[] {
  const mine = needs.get(teamId)!;
  const covered = (from: TeamNeeds, to: TeamNeeds) =>
    to.needs
      .map((n) => n.axis)
      .filter((axis) => from.surplus.some((s) => fills(axis, s.player.position)));
  return [...needs.values()]
    .filter((t) => t.teamId !== teamId)
    .map((t) => ({
      teamId: t.teamId,
      teamName: t.teamName,
      theyCover: covered(t, mine),
      youCover: covered(mine, t),
    }))
    .filter((f) => f.theyCover.length > 0 || f.youCover.length > 0)
    .sort(
      (a, b) =>
        Math.min(b.theyCover.length, b.youCover.length) -
          Math.min(a.theyCover.length, a.youCover.length) ||
        b.theyCover.length + b.youCover.length - (a.theyCover.length + a.youCover.length)
    );
}

function combinations<T>(items: T[], size: 1 | 2): T[][] {
  if (size === 1) return items.map((i) => [i]);
  return items.flatMap((a, i) => items.slice(i + 1).map((b) => [a, b]));
}

// One team's roster after a trade, cut back to the roster limit by
// dropping its lowest-projected bench players. A quick approximation for
// screening lots of trades -- the Trade Analyzer's own drop/pickup logic
// is smarter, and "Try this trade" shows its exact numbers.
function afterTrade(
  roster: RosterPlayer[],
  gives: RosterPlayer[],
  gets: RosterPlayer[],
  league: League
): RosterPlayer[] {
  let after = [...roster.filter((p) => !gives.includes(p)), ...gets];
  const active = after.filter((p) => p.lineupSlot !== "IR");
  const excess = active.length - league.rosterSize;
  if (excess > 0) {
    const lineup = optimizeLineup(after, league.lineupSlotCounts, projection);
    const cuts = new Set(
      lineup
        .filter((p) => p.lineupSlot === "Bench" && !gets.some((g) => g.playerId === p.playerId))
        .sort((a, b) => a.projectedPoints - b.projectedPoints)
        .slice(0, excess)
        .map((p) => p.playerId)
    );
    after = after.filter((p) => !cuts.has(p.playerId));
  }
  return after;
}

/**
 * For one team, the most balanced trade with each other team that
 * improves both teams' best lineups, most balanced first. Tries every 1-for-1 and 2-for-1 (in
 * either direction) between the two rosters' QBs, RBs, WRs and TEs.
 */
export function findTradePartners(league: League, teamId: number): SuggestedTrade[] {
  const needs = getLeagueNeeds(league);
  const weeks = Math.max(1, league.totalWeeks - league.currentWeek + 1);
  const me = league.teams.find((t) => t.id === teamId)!;
  const tradeable = (t: Team) =>
    t.roster.filter(
      (p) => TRADEABLE_POSITIONS.has(p.position) && p.lineupSlot !== "IR" && !isUnavailable(p)
    );
  const myBefore = lineupTotal(me.roster, league);
  const fits = new Map(getBestFits(needs, teamId).map((f) => [f.teamId, f]));

  const suggestions: SuggestedTrade[] = [];
  for (const partner of league.teams) {
    if (partner.id === teamId) continue;
    const theirBefore = lineupTotal(partner.roster, league);
    let best: { gives: RosterPlayer[]; gets: RosterPlayer[]; mine: number; theirs: number } | null =
      null;

    for (const [giveCount, getCount] of [[1, 1], [2, 1], [1, 2]] as const) {
      for (const gives of combinations(tradeable(me), giveCount)) {
        for (const gets of combinations(tradeable(partner), getCount)) {
          const mine = lineupTotal(afterTrade(me.roster, gives, gets, league), league) - myBefore;
          if (mine / weeks < MIN_WEEKLY_GAIN) continue;
          const theirs =
            lineupTotal(afterTrade(partner.roster, gets, gives, league), league) - theirBefore;
          if (theirs / weeks < MIN_WEEKLY_GAIN) continue;
          // Prefer the trade whose smaller gain is biggest: a balanced deal
          // both sides would accept, not one that mostly helps one team.
          if (!best || Math.min(mine, theirs) > Math.min(best.mine, best.theirs)) {
            best = { gives, gets, mine, theirs };
          }
        }
      }
    }

    if (best) {
      const fit = fits.get(partner.id);
      suggestions.push({
        partnerId: partner.id,
        partnerName: partner.name,
        gives: best.gives,
        gets: best.gets,
        gainPerWeek: Math.round((best.mine / weeks) * 10) / 10,
        partnerGainPerWeek: Math.round((best.theirs / weeks) * 10) / 10,
        coversNeeds: fit?.theyCover ?? [],
        partnerCoversNeeds: fit?.youCover ?? [],
      });
    }
  }

  return suggestions.sort(
    (a, b) =>
      Math.min(b.gainPerWeek, b.partnerGainPerWeek) - Math.min(a.gainPerWeek, a.partnerGainPerWeek)
  );
}
