import { FLEX_POSITIONS, lineupSlotName, positionName, proTeamAbbrev } from "./constants";
import type { League, Member, PoolPlayer, RosterPlayer, Team, WeeklyPoints } from "./types";

// The raw ESPN payload is a large, loosely-documented blob. We only read
// the handful of fields the UI needs and stay defensive about anything
// being missing/renamed, rather than trusting a strict type for it.
/* eslint-disable @typescript-eslint/no-explicit-any */

// ESPN's player.stats array carries entries for multiple seasons at once
// (e.g. both 2025's final total and 2026's in-progress total use the same
// statSourceId/statSplitTypeId combo) -- seasonId must be checked too, or
// this can silently return last year's total instead of this year's.
function findSeasonStatEntry(player: any, year: number, statSourceId: 0 | 1): any {
  const stats: any[] = player?.stats ?? [];
  return stats.find(
    (s) =>
      s?.seasonId === year &&
      s?.statSourceId === statSourceId &&
      s?.statSplitTypeId === 0 &&
      s?.scoringPeriodId === 0
  );
}

function round1(n: number | undefined): number {
  return n ? Math.round(n * 10) / 10 : 0;
}

// A single week's stat entry (statSplitTypeId 1) for the given season and
// scoring period -- as opposed to findSeasonStatEntry's scoringPeriodId 0
// (the season aggregate). Only populated once ESPN has projections/results
// for that specific week.
function findWeekStatEntry(player: any, year: number, week: number, statSourceId: 0 | 1): any {
  const stats: any[] = player?.stats ?? [];
  return stats.find(
    (s) =>
      s?.seasonId === year &&
      s?.scoringPeriodId === week &&
      s?.statSourceId === statSourceId &&
      s?.statSplitTypeId === 1
  );
}

function seasonTotalPoints(player: any, year: number): number {
  return round1(findSeasonStatEntry(player, year, 0)?.appliedTotal);
}

function seasonProjectedPoints(player: any, year: number): number {
  return round1(findSeasonStatEntry(player, year, 1)?.appliedTotal);
}

// ESPN pre-computes this as appliedTotal / games actually played, so it's
// correct even with byes/injuries factored in -- no need to count games
// ourselves. Reads 0 (not NaN) before any games have been played.
function seasonAveragePoints(player: any, year: number): number {
  return round1(findSeasonStatEntry(player, year, 0)?.appliedAverage);
}

function normalizeInjuryStatus(status: string | undefined): string {
  if (!status || status === "ACTIVE") return "";
  const map: Record<string, string> = {
    QUESTIONABLE: "Q",
    DOUBTFUL: "D",
    OUT: "O",
    INJURY_RESERVE: "IR",
    SUSPENSION: "SUSP",
  };
  return map[status] ?? status;
}

function normalizeRoster(team: any, year: number): RosterPlayer[] {
  const entries: any[] = team?.roster?.entries ?? [];
  return entries.map((entry) => {
    const player = entry?.playerPoolEntry?.player ?? {};
    const position = positionName(player.defaultPositionId);
    return {
      playerId: entry.playerId ?? player.id,
      name: player.fullName ?? "Unknown Player",
      position,
      isFlexEligible: FLEX_POSITIONS.includes(position),
      proTeam: proTeamAbbrev(player.proTeamId),
      lineupSlot: lineupSlotName(entry.lineupSlotId),
      injuryStatus: normalizeInjuryStatus(player.injuryStatus),
      seasonPoints: seasonTotalPoints(player, year),
      projectedPoints: seasonProjectedPoints(player, year),
      avgPoints: seasonAveragePoints(player, year),
    };
  });
}

function teamDisplayName(team: any): string {
  if (team.name) return team.name;
  const loc = team.location ?? "";
  const nick = team.nickname ?? "";
  const combined = `${loc} ${nick}`.trim();
  return combined || `Team ${team.id}`;
}

export function normalizeLeague(
  raw: unknown,
  leagueId: string,
  seasonYear: number,
  displayName: string
): League {
  const data = raw as any;

  const members: Member[] = (data.members ?? []).map((m: any) => {
    const realName = [m.firstName, m.lastName].filter(Boolean).join(" ");
    return {
      id: m.id,
      displayName: realName || m.displayName || "Unknown Owner",
    };
  });

  const memberById = new Map(members.map((m) => [m.id, m.displayName]));

  // Round-1 slot order in the snake draft, e.g. [6, 7, 12, ...] means team
  // 6 picked 1st, team 7 picked 2nd, etc. Comes from mSettings.
  const pickOrder: number[] = data.settings?.draftSettings?.pickOrder ?? [];

  const teams: Team[] = (data.teams ?? []).map((t: any) => {
    const ownerIds: string[] = t.owners ?? [];
    const record = t.record?.overall ?? {};
    const pickIndex = pickOrder.indexOf(t.id);
    return {
      id: t.id,
      name: teamDisplayName(t),
      abbrev: t.abbrev ?? "",
      logo: t.logo ?? null,
      ownerIds,
      ownerNames: ownerIds.map((id) => memberById.get(id) ?? "Unknown Owner"),
      wins: record.wins ?? 0,
      losses: record.losses ?? 0,
      ties: record.ties ?? 0,
      pointsFor: record.pointsFor ? Math.round(record.pointsFor * 10) / 10 : 0,
      pointsAgainst: record.pointsAgainst
        ? Math.round(record.pointsAgainst * 10) / 10
        : 0,
      playoffSeed: t.playoffSeed ?? null,
      draftPosition: pickIndex === -1 ? null : pickIndex + 1,
      roster: normalizeRoster(t, seasonYear),
    };
  });

  // ESPN keys these by lineup slot id, including every slot type it
  // supports (most at 0) -- keep only the starter slots this league uses.
  const lineupSlotCounts: Record<string, number> = {};
  let rosterSize = 0;
  for (const [slotId, count] of Object.entries<number>(
    data.settings?.rosterSettings?.lineupSlotCounts ?? {}
  )) {
    const slot = lineupSlotName(Number(slotId));
    if (!count || slot === "IR") continue;
    rosterSize += count;
    if (slot !== "Bench") lineupSlotCounts[slot] = count;
  }

  return {
    leagueId,
    name: data.settings?.name || displayName,
    seasonYear,
    // status.currentMatchupPeriod is ESPN's own "what week is it right
    // now" (they already apply the Wed-Tue boundary on their end).
    currentWeek: data.status?.currentMatchupPeriod ?? 1,
    totalWeeks: data.status?.finalScoringPeriod ?? 17,
    lineupSlotCounts,
    rosterSize,
    members,
    teams,
  };
}

// Normalizes the raw mMatchupScore schedule into teamId -> week ->
// that week's final actual score, capped at `maxWeek` (the last
// *completed* week -- the in-progress current week's matchup is still
// live/non-final, so callers pass league.currentWeek - 1 here rather
// than including a partial score).
export function normalizeTeamWeeklyScores(
  raw: unknown,
  maxWeek: number
): Map<number, Map<number, number>> {
  const schedule: any[] = (raw as any)?.schedule ?? [];
  const result = new Map<number, Map<number, number>>();
  for (const m of schedule) {
    const week = m?.matchupPeriodId;
    if (!week || week > maxWeek) continue;
    for (const side of [m.home, m.away]) {
      const teamId = side?.teamId;
      if (teamId == null) continue;
      let byWeek = result.get(teamId);
      if (!byWeek) {
        byWeek = new Map();
        result.set(teamId, byWeek);
      }
      byWeek.set(week, side.totalPoints ?? 0);
    }
  }
  return result;
}

// Normalizes one entry from ESPN's player-pool (kona_player_info) response
// -- the wider NFL player universe, independent of any one league's roster.
export function normalizePoolPlayer(entry: unknown, year: number): PoolPlayer {
  const e = entry as any;
  const player = e?.player ?? {};
  const position = positionName(player.defaultPositionId);
  return {
    playerId: e.id ?? player.id,
    name: player.fullName ?? "Unknown Player",
    position,
    isFlexEligible: FLEX_POSITIONS.includes(position),
    proTeam: proTeamAbbrev(player.proTeamId),
    injuryStatus: normalizeInjuryStatus(player.injuryStatus),
    seasonPoints: seasonTotalPoints(player, year),
    projectedPoints: seasonProjectedPoints(player, year),
    avgPoints: seasonAveragePoints(player, year),
    percentOwned: player.ownership?.percentOwned
      ? Math.round(player.ownership.percentOwned * 10) / 10
      : 0,
  };
}

// Normalizes one entry from the same player-pool endpoint, but requested
// with filterIds + filterStatsForScoringPeriodIds -- gives that one week's
// actual/projected points instead of season totals.
export function normalizeWeeklyPoints(
  entry: unknown,
  year: number,
  week: number
): { playerId: number; weekly: WeeklyPoints } {
  const e = entry as any;
  const player = e?.player ?? {};
  return {
    playerId: e.id ?? player.id,
    weekly: {
      points: round1(findWeekStatEntry(player, year, week, 0)?.appliedTotal),
      projected: round1(findWeekStatEntry(player, year, week, 1)?.appliedTotal),
    },
  };
}
