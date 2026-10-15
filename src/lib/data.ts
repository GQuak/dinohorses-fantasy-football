import {
  fetchLeagueRaw,
  fetchMatchupScoresRaw,
  fetchPlayerPoolRaw,
  fetchWeeklyStatsRaw,
  EspnApiError,
} from "./espn";
import {
  normalizeLeague,
  normalizePoolPlayer,
  normalizeTeamWeeklyScores,
  normalizeWeeklyPoints,
} from "./normalize";
import {
  MOCK_LEAGUES,
  buildMockCumulativePoints,
  buildMockPlayerPool,
  buildMockWeeklyPoints,
} from "./mockData";
import { POSITION_AXES, POSITION_AXIS_WEIGHTS } from "./constants";
import { rankFraction } from "./rank";
import type {
  CumulativePointsData,
  DashboardData,
  League,
  RosterSpot,
  PoolPlayer,
  PositionAxisRank,
  RankedPlayer,
  RosterPlayer,
  StarterRankInfo,
  WeeklyPoints,
} from "./types";

// How many of the highest-owned NFL players to pull in for Player
// Rankings, beyond whatever's already rostered in your league.
const PLAYER_POOL_LIMIT = 300;

interface LeagueConfig {
  id: string;
  name: string;
  espnS2?: string;
  swid?: string;
}

function getLeagueConfigs(): LeagueConfig[] {
  const id = process.env.LEAGUE_1_ID;
  if (!id) return [];
  return [
    {
      id,
      name: process.env.LEAGUE_1_NAME || "My League",
      espnS2: process.env.ESPN_S2,
      swid: process.env.ESPN_SWID,
    },
  ];
}

function seasonYear(): number {
  const y = Number(process.env.SEASON_YEAR);
  return Number.isFinite(y) && y > 2000 ? y : new Date().getFullYear();
}

/**
 * Loads the league. Falls back to bundled demo data when no league ID is
 * configured yet, so the dashboard is browsable out of the box.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const configs = getLeagueConfigs();

  if (configs.length === 0) {
    return { leagues: MOCK_LEAGUES, isDemoData: true, errors: [] };
  }

  const year = seasonYear();
  const errors: DashboardData["errors"] = [];

  const results = await Promise.all(
    configs.map(async (cfg): Promise<League | null> => {
      try {
        const raw = await fetchLeagueRaw(cfg.id, year, {
          espnS2: cfg.espnS2,
          swid: cfg.swid,
        });
        return normalizeLeague(raw, cfg.id, year, cfg.name);
      } catch (err) {
        const message =
          err instanceof EspnApiError ? err.message : "Unexpected error fetching league data.";
        console.error(`[espn] failed to load league ${cfg.name} (${cfg.id}):`, err);
        errors.push({ leagueName: cfg.name, message });
        return null;
      }
    })
  );

  const leagues = results.filter((l): l is League => l !== null);

  return { leagues, isDemoData: false, errors };
}

/**
 * Builds the full Player Rankings list: every rostered player in the
 * league, plus the wider NFL free-agent pool (top `PLAYER_POOL_LIMIT` by
 * ESPN-wide ownership). `leagues` should come from getDashboardData() so
 * roster status/team can be cross-referenced onto the pool.
 */
export async function getPlayerPool(
  leagues: League[],
  isDemoData: boolean
): Promise<{ players: RankedPlayer[]; error: string | null }> {
  if (isDemoData) {
    return { players: buildMockPlayerPool(), error: null };
  }

  const configs = getLeagueConfigs();
  if (configs.length === 0) {
    return { players: [], error: null };
  }

  const year = seasonYear();
  const cfg = configs[0];

  const rosterIndex = new Map<number, RosterSpot>();
  // Also keep one full RosterPlayer record per id, as a source for
  // name/position/stats when a rostered player didn't land in the pool
  // fetch below.
  const rosterPlayerById = new Map<number, RosterPlayer>();
  for (const league of leagues) {
    for (const team of league.teams) {
      for (const player of team.roster) {
        rosterIndex.set(player.playerId, {
          teamName: team.name,
          ownerNames: team.ownerNames,
          lineupSlot: player.lineupSlot,
        });
        rosterPlayerById.set(player.playerId, player);
      }
    }
  }

  let poolPlayers: PoolPlayer[] = [];
  let error: string | null = null;
  try {
    const raw = await fetchPlayerPoolRaw(
      cfg.id,
      year,
      { espnS2: cfg.espnS2, swid: cfg.swid },
      PLAYER_POOL_LIMIT
    );
    poolPlayers = (raw as unknown[]).map((entry) => normalizePoolPlayer(entry, year));
  } catch (err) {
    error =
      err instanceof EspnApiError ? err.message : "Unexpected error fetching the player pool.";
    console.error("[espn] failed to load player pool:", err);
  }

  const seen = new Set<number>();
  const players: RankedPlayer[] = [];

  for (const p of poolPlayers) {
    const rosterSpot = rosterIndex.get(p.playerId) ?? null;
    seen.add(p.playerId);
    players.push({
      ...p,
      isRostered: rosterSpot !== null,
      rosterSpot,
    });
  }

  // Any rostered player who didn't happen to land in the top-N-by-ownership
  // pool fetch (rare -- e.g. a very low-ownership deep stash) still needs
  // to show up, since they're relevant to your league either way.
  for (const [playerId, rosterSpot] of rosterIndex) {
    if (seen.has(playerId)) continue;
    seen.add(playerId);
    const rp = rosterPlayerById.get(playerId);
    if (!rp) continue;
    players.push({
      playerId: rp.playerId,
      name: rp.name,
      position: rp.position,
      isFlexEligible: rp.isFlexEligible,
      proTeam: rp.proTeam,
      injuryStatus: rp.injuryStatus,
      seasonPoints: rp.seasonPoints,
      projectedPoints: rp.projectedPoints,
      avgPoints: rp.avgPoints,
      percentOwned: 0,
      isRostered: true,
      rosterSpot,
    });
  }

  return { players, error };
}

/**
 * Fetches one week's actual + projected points for a specific set of
 * players (a single team's roster) in a single league. Not folded into
 * getDashboardData()/normalizeLeague() because ESPN only returns full
 * weekly breakdowns from the separate player-pool endpoint -- the
 * roster-embedded player objects always cap at season totals.
 */
export async function getTeamWeeklyPoints(
  leagueId: string,
  playerIds: number[],
  week: number,
  isDemoData: boolean
): Promise<{ points: Map<number, WeeklyPoints>; error: string | null }> {
  if (isDemoData) {
    return { points: buildMockWeeklyPoints(playerIds, week), error: null };
  }

  const cfg = getLeagueConfigs().find((c) => c.id === leagueId);
  if (!cfg || playerIds.length === 0) {
    return { points: new Map(), error: null };
  }

  const year = seasonYear();
  try {
    const raw = await fetchWeeklyStatsRaw(
      cfg.id,
      year,
      { espnS2: cfg.espnS2, swid: cfg.swid },
      playerIds,
      week
    );
    const points = new Map<number, WeeklyPoints>();
    for (const entry of raw as unknown[]) {
      const { playerId, weekly } = normalizeWeeklyPoints(entry, year, week);
      points.set(playerId, weekly);
    }
    return { points, error: null };
  } catch (err) {
    const message =
      err instanceof EspnApiError ? err.message : "Unexpected error fetching weekly stats.";
    console.error(`[espn] failed to load week ${week} stats (league ${leagueId}):`, err);
    return { points: new Map(), error: message };
  }
}

/**
 * Builds the Standings page's cumulative-points-by-week line chart data
 * for one league: every team's running total of actual points, one entry
 * per completed week. Sourced from ESPN's matchup schedule (each week's
 * final head-to-head score) rather than summed from per-player stats --
 * see normalizeTeamWeeklyScores for why that avoids the historical-roster
 * bug the weekly recap pages had to work around.
 */
export async function getCumulativePoints(
  league: League,
  isDemoData: boolean
): Promise<{ data: CumulativePointsData; error: string | null }> {
  if (isDemoData) {
    return { data: buildMockCumulativePoints(league), error: null };
  }

  const lastCompletedWeek = league.currentWeek - 1;
  if (lastCompletedWeek < 1) {
    return { data: { weeks: [], series: [] }, error: null };
  }

  const cfg = getLeagueConfigs().find((c) => c.id === league.leagueId);
  if (!cfg) {
    return { data: { weeks: [], series: [] }, error: null };
  }

  const year = seasonYear();
  try {
    const raw = await fetchMatchupScoresRaw(cfg.id, year, {
      espnS2: cfg.espnS2,
      swid: cfg.swid,
    });
    const weeklyByTeam = normalizeTeamWeeklyScores(raw, lastCompletedWeek);
    const weeks = Array.from({ length: lastCompletedWeek }, (_, i) => i + 1);

    const series = league.teams.map((team) => {
      const weekly = weeklyByTeam.get(team.id);
      const weeklyPoints = weeks.map((w) => Math.round((weekly?.get(w) ?? 0) * 10) / 10);
      let running = 0;
      const points = weeklyPoints.map((v) => {
        running += v;
        return Math.round(running * 10) / 10;
      });
      return { teamId: team.id, teamName: team.name, points, weeklyPoints };
    });

    return { data: { weeks, series }, error: null };
  } catch (err) {
    const message =
      err instanceof EspnApiError
        ? err.message
        : "Unexpected error fetching the matchup schedule.";
    console.error(`[espn] failed to load matchup scores (league ${league.leagueId}):`, err);
    return { data: { weeks: [], series: [] }, error: message };
  }
}

/**
 * Builds the "Position Strength" radar data for one team: for each
 * starter-slot position (QB, RB, WR, TE, FLEX, D/ST, K), how this team's
 * STARTERS at that position rank against every other team in the same
 * league's starters at that position.
 *
 * `week === "season"` ranks by each player's full-season projected points
 * (no extra fetch -- already on the roster). Deliberately projected, not
 * season-to-date actual: early in the season almost nobody has scored
 * real points yet, which made most axes read as a meaningless tie at
 * zero. A specific week ranks by that week's projected points, using a
 * `weeklyPoints` map the caller fetched (one bulk call covering every
 * rostered player in the league) -- passed in rather than fetched here
 * so callers who need it for more than one computation (e.g. this *and*
 * getStartingLineupRanks, for a shared season/week toggle) only fetch it
 * once. Pure/synchronous.
 */
export function getTeamPositionStrength(
  league: League,
  teamId: number,
  week: number | "season",
  weeklyPoints: Map<number, WeeklyPoints> | null
): { axes: PositionAxisRank[] } {
  const valueFor = (p: RosterPlayer): number =>
    week === "season" ? p.projectedPoints : weeklyPoints?.get(p.playerId)?.projected ?? 0;

  // teamId -> axis -> summed value
  const starterSums = new Map<number, Record<string, number>>();

  for (const team of league.teams) {
    const starters: Record<string, number> = {};
    for (const p of team.roster) {
      if (POSITION_AXES.includes(p.lineupSlot)) {
        starters[p.lineupSlot] = (starters[p.lineupSlot] ?? 0) + valueFor(p);
      }
    }
    starterSums.set(team.id, starters);
  }

  function rankOf(sums: Map<number, Record<string, number>>, axis: string, forTeamId: number) {
    const ranked = league.teams
      .map((t) => ({ teamId: t.id, value: sums.get(t.id)?.[axis] ?? 0 }))
      .sort((a, b) => b.value - a.value);
    const index = ranked.findIndex((r) => r.teamId === forTeamId);
    return { rank: index === -1 ? ranked.length : index + 1, value: ranked[index]?.value ?? 0 };
  }

  const axes: PositionAxisRank[] = POSITION_AXES.map((axis) => {
    const starter = rankOf(starterSums, axis, teamId);
    return {
      axis,
      starterRank: starter.rank,
      starterValue: Math.round(starter.value * 10) / 10,
      totalTeams: league.teams.length,
    };
  });

  return { axes };
}

/**
 * Computes an aggregate "Power Score" (0-100) for every team in a league:
 * the weighted average, across the same seven Position Strength axes, of
 * each team's per-axis rank expressed as a 0..1 fraction (#1 in the league
 * = 1.0, last place = the smallest positive fraction, no points at that
 * axis = 0). It's the same per-axis ranking the Position Strength radar
 * already plots, just averaged into one number so teams can be sorted
 * overall instead of position-by-position.
 *
 * RB and WR are weighted double every other axis (see
 * POSITION_AXIS_WEIGHTS) -- a #1 RB rank contributes 200 into the weighted
 * sum instead of 100, same as a #1 RB *and* a hypothetical second #1 axis
 * would. The sum is divided by the total weight (9, not 7) so the result
 * stays on a 0-100 scale either way.
 *
 * The fraction (not the raw rank) is what makes this comparable *across*
 * leagues of different sizes -- #1 of 10 and #1 of 12 both average in as
 * 1.0, rather than unfairly favoring whichever league happens to be
 * smaller. Computed for the whole league at once (rather than by calling
 * getTeamPositionStrength once per team) so each axis's ranking pass runs
 * once, not once per team.
 */
export function getLeaguePowerScores(
  league: League,
  week: number | "season",
  weeklyPoints: Map<number, WeeklyPoints> | null
): Map<number, number> {
  const valueFor = (p: RosterPlayer): number =>
    week === "season" ? p.projectedPoints : weeklyPoints?.get(p.playerId)?.projected ?? 0;

  const starterSums = new Map<number, Record<string, number>>();
  for (const team of league.teams) {
    const starters: Record<string, number> = {};
    for (const p of team.roster) {
      if (POSITION_AXES.includes(p.lineupSlot)) {
        starters[p.lineupSlot] = (starters[p.lineupSlot] ?? 0) + valueFor(p);
      }
    }
    starterSums.set(team.id, starters);
  }

  const totalTeams = league.teams.length;
  const fractionSums = new Map<number, number>();
  for (const team of league.teams) fractionSums.set(team.id, 0);

  for (const axis of POSITION_AXES) {
    const weight = POSITION_AXIS_WEIGHTS[axis] ?? 1;
    const ranked = league.teams
      .map((t) => ({ teamId: t.id, value: starterSums.get(t.id)?.[axis] ?? 0 }))
      .sort((a, b) => b.value - a.value);
    ranked.forEach((r, i) => {
      const fraction = r.value > 0 ? rankFraction(i + 1, totalTeams) : 0;
      fractionSums.set(r.teamId, (fractionSums.get(r.teamId) ?? 0) + fraction * weight);
    });
  }

  const totalWeight = POSITION_AXES.reduce(
    (sum, axis) => sum + (POSITION_AXIS_WEIGHTS[axis] ?? 1),
    0
  );

  const scores = new Map<number, number>();
  for (const team of league.teams) {
    const avgFraction = (fractionSums.get(team.id) ?? 0) / totalWeight;
    scores.set(team.id, Math.round(avgFraction * 1000) / 10);
  }
  return scores;
}

/**
 * Builds the "Starting Lineup" bar-chart data for one team: each starter,
 * labeled by slot (RB1/RB2 = that team's two RB starters, higher
 * projection first; same for WR1/WR2). Pure/synchronous.
 *
 * `weeklyPoints === null` uses each player's season-long projectedPoints
 * (already on the roster). Passing a weekly-points map (the same one
 * getTeamPositionStrength takes, for a shared season/week toggle across
 * both charts) switches every value here -- bar height, RB1/RB2
 * ordering, and the rank pools -- to that week's projected points
 * instead.
 *
 * Each player ranks only against other teams' same-ordinal starter in
 * that slot: RB1 (each team's *better* RB) ranks against every other
 * team's RB1, separately from RB2 (each team's *other* RB) ranking
 * against every other team's RB2 -- not one pool of every RB starter
 * league-wide. That split matters: a team's RB1 can rank poorly among
 * RB1s while their RB2 ranks #1 among RB2s (a deep RB corps, not
 * necessarily a great RB1), and lumping both slots into one pool would
 * hide that.
 *
 * Also grouped by lineup slot, not true position: a FLEX-slotted RB is
 * *not* compared against dedicated RB1/RB2 starters -- it's ranked
 * against every other team's FLEX starter instead, whatever position
 * they happen to be.
 */
export function getStartingLineupRanks(
  league: League,
  teamId: number,
  weeklyPoints: Map<number, WeeklyPoints> | null
): StarterRankInfo[] {
  const team = league.teams.find((t) => t.id === teamId);
  if (!team) return [];

  const valueFor = (p: RosterPlayer): number =>
    weeklyPoints ? (weeklyPoints.get(p.playerId)?.projected ?? 0) : p.projectedPoints;

  // Each team's own starters in each slot, ordered by projected points
  // (highest first) -- this ordering is both the RB1/RB2 label *and*
  // which ordinal pool (`${axis}#${ordinal}`) a player is ranked within.
  function orderedBySlot(roster: RosterPlayer[]): Map<string, RosterPlayer[]> {
    const bySlot = new Map<string, RosterPlayer[]>();
    for (const p of roster) {
      if (!POSITION_AXES.includes(p.lineupSlot)) continue; // starters only
      const list = bySlot.get(p.lineupSlot);
      if (list) list.push(p);
      else bySlot.set(p.lineupSlot, [p]);
    }
    for (const [slot, players] of bySlot) {
      bySlot.set(
        slot,
        [...players].sort((a, b) => valueFor(b) - valueFor(a))
      );
    }
    return bySlot;
  }

  const pools = new Map<string, RosterPlayer[]>(); // key: `${axis}#${ordinal}`
  for (const t of league.teams) {
    for (const [axis, players] of orderedBySlot(t.roster)) {
      players.forEach((p, ordinal) => {
        const key = `${axis}#${ordinal}`;
        const list = pools.get(key);
        if (list) list.push(p);
        else pools.set(key, [p]);
      });
    }
  }
  const rankByPlayerId = new Map<number, { rank: number; total: number }>();
  for (const players of pools.values()) {
    const sorted = [...players].sort((a, b) => valueFor(b) - valueFor(a));
    sorted.forEach((p, i) => rankByPlayerId.set(p.playerId, { rank: i + 1, total: sorted.length }));
  }

  const bySlot = orderedBySlot(team.roster);
  const result: StarterRankInfo[] = [];
  for (const axis of POSITION_AXES) {
    const players = bySlot.get(axis) ?? [];
    players.forEach((player, i) => {
      const slotLabel = players.length > 1 ? `${axis}${i + 1}` : axis;
      const r = rankByPlayerId.get(player.playerId);
      result.push({
        slotLabel,
        axis,
        player,
        points: Math.round(valueFor(player) * 10) / 10,
        positionRank: r?.rank ?? 0,
        totalAtPosition: r?.total ?? 0,
      });
    });
  }
  return result;
}
