import { isUnavailable } from "./trade";
import { fills, lineupTotal, type TeamNeeds } from "./tradeNeeds";
import type { League, RankedPlayer, RosterPlayer } from "./types";

// Free-agent recommendations, using the same pickup logic as the Trade
// Analyzer: a free agent is worth adding when he improves a team's best
// possible lineup by ESPN's rest-of-season projections, after the team
// drops whoever its lineup misses least if the roster is full.

// How many of the best free agents (by projection) to evaluate. Anyone
// further down the pool won't crack a lineup.
const CANDIDATE_POOL = 60;
// Gains smaller than this (pts/week) aren't worth a roster move.
const MIN_WEEKLY_GAIN = 0.1;
// Teams rarely swap a QB, kicker or defense for a small upgrade, so the
// league-wide list only counts bigger gains at those positions.
const MIN_WEEKLY_GAIN_ONE_SLOT = 1.0;

// The Player Rankings page's free-agent sections, in display order.
// `filter` is the rankings position filter that shows just that section;
// `allViewLimit` is how many it shows when no position is picked (0 =
// left out of the All view -- RB/WR/TE are covered there by FLEX).
export const FREE_AGENT_GROUPS: {
  id: string;
  label: string;
  filter: string;
  positions: string[];
  allViewLimit: number;
  minWeeklyGain: number;
}[] = [
  {
    id: "flex",
    label: "FLEX (RB/WR/TE)",
    filter: "FLEX",
    positions: ["RB", "WR", "TE"],
    allViewLimit: 6,
    minWeeklyGain: MIN_WEEKLY_GAIN,
  },
  {
    id: "qb",
    label: "QB",
    filter: "QB",
    positions: ["QB"],
    allViewLimit: 3,
    minWeeklyGain: MIN_WEEKLY_GAIN_ONE_SLOT,
  },
  {
    id: "k",
    label: "Kickers",
    filter: "K",
    positions: ["K"],
    allViewLimit: 3,
    minWeeklyGain: MIN_WEEKLY_GAIN_ONE_SLOT,
  },
  {
    id: "dst",
    label: "Defenses",
    filter: "D/ST",
    positions: ["D/ST"],
    allViewLimit: 3,
    minWeeklyGain: MIN_WEEKLY_GAIN_ONE_SLOT,
  },
  {
    id: "rb",
    label: "RB",
    filter: "RB",
    positions: ["RB"],
    allViewLimit: 0,
    minWeeklyGain: MIN_WEEKLY_GAIN,
  },
  {
    id: "wr",
    label: "WR",
    filter: "WR",
    positions: ["WR"],
    allViewLimit: 0,
    minWeeklyGain: MIN_WEEKLY_GAIN,
  },
  {
    id: "te",
    label: "TE",
    filter: "TE",
    positions: ["TE"],
    allViewLimit: 0,
    minWeeklyGain: MIN_WEEKLY_GAIN,
  },
];

// How many players a section shows when its own position is picked.
const SINGLE_POSITION_LIMIT = 8;

export interface TeamFreeAgentFit {
  player: RosterPlayer;
  gainPerWeek: number; // best-lineup change, pts/week
  drop: RosterPlayer | null; // who'd make room, if the roster is full
  fillsNeeds: string[]; // which of the team's trade needs he fills
}

export interface LeagueFreeAgentFit {
  player: RosterPlayer;
  teamsHelped: number; // how many teams' best lineups he'd improve
  totalTeams: number;
  bestTeam: { teamId: number; teamName: string; gainPerWeek: number } | null;
}

/**
 * The best free agents in the player pool as roster players, skipping
 * anyone ruled out (out, on IR, suspended). `positions` limits the pool
 * before the cut, so kickers and defenses aren't crowded out by RBs/WRs.
 */
export function freeAgentCandidates(players: RankedPlayer[], positions?: string[]): RosterPlayer[] {
  return players
    .filter((p) => !p.isRostered && (!positions || positions.includes(p.position)))
    .map(
      (p): RosterPlayer => ({
        playerId: p.playerId,
        name: p.name,
        position: p.position,
        isFlexEligible: p.isFlexEligible,
        proTeam: p.proTeam,
        lineupSlot: "Bench",
        injuryStatus: p.injuryStatus,
        seasonPoints: p.seasonPoints,
        projectedPoints: p.projectedPoints,
        avgPoints: p.avgPoints,
      })
    )
    .filter((p) => !isUnavailable(p))
    .sort((a, b) => b.projectedPoints - a.projectedPoints)
    .slice(0, CANDIDATE_POOL);
}

const weeksLeft = (league: League) => Math.max(1, league.totalWeeks - league.currentWeek + 1);

// One free agent's effect on one team's best lineup (rest-of-season
// total), and who the team would drop to make room if it's full.
function pickupGain(
  roster: RosterPlayer[],
  candidate: RosterPlayer,
  league: League,
  before: number
): { gain: number; drop: RosterPlayer | null } {
  const added = [...roster, candidate];
  const active = added.filter((p) => p.lineupSlot !== "IR");
  if (active.length <= league.rosterSize) {
    return { gain: lineupTotal(added, league) - before, drop: null };
  }
  // Drop whoever costs the lineup least, lowest projection first.
  let best: { total: number; drop: RosterPlayer } | null = null;
  for (const p of roster) {
    if (p.lineupSlot === "IR") continue;
    const total = lineupTotal(
      added.filter((x) => x !== p),
      league
    );
    if (
      !best ||
      total > best.total + 0.05 ||
      (Math.abs(total - best.total) <= 0.05 && p.projectedPoints < best.drop.projectedPoints)
    ) {
      best = { total, drop: p };
    }
  }
  return { gain: best!.total - before, drop: best!.drop };
}

/** The free agents that would most improve one team's best lineup. */
export function getTeamFreeAgentFits(
  league: League,
  teamId: number,
  candidates: RosterPlayer[],
  needs: TeamNeeds | undefined,
  limit = 5
): TeamFreeAgentFit[] {
  const team = league.teams.find((t) => t.id === teamId);
  if (!team) return [];
  const before = lineupTotal(team.roster, league);
  const weeks = weeksLeft(league);

  return candidates
    .map((player) => {
      const { gain, drop } = pickupGain(team.roster, player, league, before);
      return {
        player,
        gainPerWeek: Math.round((gain / weeks) * 10) / 10,
        drop,
        fillsNeeds: (needs?.needs ?? [])
          .map((n) => n.axis)
          .filter((axis) => fills(axis, player.position)),
      };
    })
    .filter((f) => f.gainPerWeek >= MIN_WEEKLY_GAIN)
    .sort((a, b) => b.gainPerWeek - a.gainPerWeek)
    .slice(0, limit);
}

/**
 * The free agents who'd help the most teams, for the Player Rankings
 * page: how many teams' best lineups each would improve, and which team
 * he'd help most.
 */
export function getLeagueFreeAgentFits(
  league: League,
  candidates: RosterPlayer[],
  limit = 10,
  minWeeklyGain = MIN_WEEKLY_GAIN
): LeagueFreeAgentFit[] {
  const weeks = weeksLeft(league);
  const befores = new Map(league.teams.map((t) => [t.id, lineupTotal(t.roster, league)]));

  return candidates
    .map((player) => {
      let teamsHelped = 0;
      let bestTeam: LeagueFreeAgentFit["bestTeam"] = null;
      for (const team of league.teams) {
        const { gain } = pickupGain(team.roster, player, league, befores.get(team.id)!);
        const perWeek = Math.round((gain / weeks) * 10) / 10;
        if (perWeek < minWeeklyGain) continue;
        teamsHelped++;
        if (!bestTeam || perWeek > bestTeam.gainPerWeek) {
          bestTeam = { teamId: team.id, teamName: team.name.trim(), gainPerWeek: perWeek };
        }
      }
      return { player, teamsHelped, totalTeams: league.teams.length, bestTeam };
    })
    .filter((f) => f.teamsHelped > 0)
    .sort(
      (a, b) =>
        b.teamsHelped - a.teamsHelped ||
        (b.bestTeam?.gainPerWeek ?? 0) - (a.bestTeam?.gainPerWeek ?? 0)
    )
    .slice(0, limit);
}

export interface FreeAgentGroup {
  id: string;
  label: string;
  filter: string;
  allViewLimit: number;
  minWeeklyGain: number;
  fits: LeagueFreeAgentFit[]; // up to SINGLE_POSITION_LIMIT, best first
}

/** League-wide free-agent fits, one section per FREE_AGENT_GROUPS entry. */
export function getGroupedLeagueFreeAgentFits(
  league: League,
  players: RankedPlayer[]
): FreeAgentGroup[] {
  return FREE_AGENT_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    filter: g.filter,
    allViewLimit: g.allViewLimit,
    minWeeklyGain: g.minWeeklyGain,
    fits: getLeagueFreeAgentFits(
      league,
      freeAgentCandidates(players, g.positions),
      SINGLE_POSITION_LIMIT,
      g.minWeeklyGain
    ),
  }));
}
