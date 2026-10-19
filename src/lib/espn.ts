// Thin client for ESPN's unofficial Fantasy Football read API.
// Docs don't exist officially; this endpoint shape + cookie auth scheme is
// the widely-used community-reverse-engineered approach.

export interface EspnCredentials {
  espnS2?: string;
  swid?: string;
}

export class EspnApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "EspnApiError";
  }
}

// ESPN moved the read API here at some point; the older
// fantasy.espn.com/apis/v3/... host now just 302s to the marketing site.
const BASE = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons";

async function espnRequest(
  url: string,
  creds: EspnCredentials,
  extraHeaders: Record<string, string> = {},
  // The player-pool response (hundreds of players' full stat blocks) can
  // exceed Next.js's 2MB fetch-cache-entry limit; caching it just fails
  // silently (with a console warning) rather than actually caching, so
  // callers with a large response opt out of the data cache entirely.
  cacheable = true,
  revalidateSeconds = 300
): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extraHeaders,
  };
  if (creds.espnS2 && creds.swid) {
    headers.Cookie = `espn_s2=${creds.espnS2}; SWID=${creds.swid}`;
  }

  const res = await fetch(url, {
    headers,
    ...(cacheable ? { next: { revalidate: revalidateSeconds } } : { cache: "no-store" as const }),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new EspnApiError(
        "ESPN rejected the request — the league is private and espn_s2/SWID are missing, expired, or wrong for this account.",
        res.status
      );
    }
    if (res.status === 404) {
      throw new EspnApiError(
        "League not found for that ID/season — double check LEAGUE ID and SEASON_YEAR.",
        res.status
      );
    }
    throw new EspnApiError(`ESPN API returned ${res.status} ${res.statusText}`, res.status);
  }

  return res.json();
}

/**
 * Fetches the raw league payload (teams, rosters, standings, members) for
 * one league/season. Revalidated every 5 minutes via Next.js's fetch cache
 * so repeat page loads don't hammer ESPN.
 */
export async function fetchLeagueRaw(
  leagueId: string,
  seasonYear: number,
  creds: EspnCredentials
): Promise<unknown> {
  const url =
    `${BASE}/${seasonYear}/segments/0/leagues/${leagueId}` +
    `?view=mTeam&view=mRoster&view=mStandings&view=mSettings`;
  return espnRequest(url, creds);
}

/**
 * Fetches the wider NFL player pool (rostered + free agents), sorted by
 * ESPN-wide ownership percentage, for one league/season. `leagueId` is
 * only used for auth context here — player stats/ownership aren't
 * league-specific, so any league ID you have access to works.
 */
export async function fetchPlayerPoolRaw(
  leagueId: string,
  seasonYear: number,
  creds: EspnCredentials,
  limit: number
): Promise<unknown> {
  const url =
    `${BASE}/${seasonYear}/segments/0/leagues/${leagueId}` + `?view=kona_player_info`;
  const filter = {
    players: {
      limit,
      sortPercOwned: { sortPriority: 1, sortAsc: false },
    },
  };
  const raw = await espnRequest(
    url,
    creds,
    { "X-Fantasy-Filter": JSON.stringify(filter) },
    false
  );
  return (raw as { players?: unknown[] })?.players ?? [];
}

/**
 * Fetches the full matchup schedule (every week, every head-to-head
 * matchup) for one league/season -- each entry carries both teams' final
 * score for that week directly from ESPN, rather than it needing to be
 * derived by summing individual players' stats. This is what powers the
 * Standings page's cumulative-points-by-week chart: it's immune to the
 * historical-roster bug that bit the weekly recap pages (see
 * normalizeTeamWeeklyScores), since ESPN computes each matchup's final
 * score once, at the time, and that's what this endpoint always returns.
 */
export async function fetchMatchupScoresRaw(
  leagueId: string,
  seasonYear: number,
  creds: EspnCredentials
): Promise<unknown> {
  const url =
    `${BASE}/${seasonYear}/segments/0/leagues/${leagueId}` + `?view=mMatchupScore`;
  return espnRequest(url, creds);
}

/**
 * Fetches one week's actual + projected points for a specific set of
 * players (e.g. one team's roster). Uses the same player-pool endpoint as
 * fetchPlayerPoolRaw, but filtered to just those player ids and that one
 * scoring period -- ESPN only returns full weekly breakdowns from this
 * endpoint, not from the roster-embedded player objects.
 */
export async function fetchWeeklyStatsRaw(
  leagueId: string,
  seasonYear: number,
  creds: EspnCredentials,
  playerIds: number[],
  week: number
): Promise<unknown> {
  if (playerIds.length === 0) return [];
  const url =
    `${BASE}/${seasonYear}/segments/0/leagues/${leagueId}` + `?view=kona_player_info`;
  const filter = {
    players: {
      filterIds: { value: playerIds },
      filterStatsForScoringPeriodIds: { value: [week] },
    },
  };
  // Not cached: the URL is identical for every team/week combination (only
  // the filter header changes), and Next's fetch cache keys on the URL --
  // caching here would silently serve one week's numbers for another.
  const raw = await espnRequest(
    url,
    creds,
    { "X-Fantasy-Filter": JSON.stringify(filter) },
    false
  );
  return (raw as { players?: unknown[] })?.players ?? [];
}

/**
 * Fetches one week's head-to-head matchups with each team's starters and
 * their points so far -- live during the week, final afterwards. Cached
 * for just a minute so scores stay current during games. The week is in
 * the URL (scoringPeriodId), so each week gets its own cache entry even
 * though the filter header also varies.
 */
export async function fetchWeekMatchupsRaw(
  leagueId: string,
  seasonYear: number,
  creds: EspnCredentials,
  week: number
): Promise<unknown> {
  const url =
    `${BASE}/${seasonYear}/segments/0/leagues/${leagueId}` +
    `?view=mBoxscore&view=mMatchupScore&scoringPeriodId=${week}`;
  const filter = { schedule: { filterMatchupPeriodIds: { value: [week] } } };
  return espnRequest(url, creds, { "X-Fantasy-Filter": JSON.stringify(filter) }, true, 60);
}

/**
 * Fetches the NFL schedule for the season: every pro team's game (kickoff
 * time, whether stats are official) in each scoring period. Not
 * league-specific. Changes rarely, so it's cached for a day.
 */
export async function fetchProScheduleRaw(
  seasonYear: number,
  creds: EspnCredentials
): Promise<unknown> {
  const url =
    `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonYear}` +
    `?view=proTeamSchedules_wl`;
  return espnRequest(url, creds, {}, true, 86400);
}
