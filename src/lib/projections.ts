import { unstable_cache } from "next/cache";
import type { RosterPlayer } from "./types";

// Rest-of-season projections from sources other than ESPN, for the Trade
// Analyzer's source switch. Neither source knows ESPN player ids, so
// players are matched by normalized name + position (team breaks ties),
// and defenses by team.
//
// Both sources use their full-PPR numbers -- this league scores 1 point
// per reception. Their kicker and defense scoring won't exactly match the
// league's ESPN settings, so K and D/ST numbers are rougher than the rest.
//
// - Sleeper: free, unofficial API with weekly projections (supplied to
//   Sleeper by RotoWire). There's no rest-of-season endpoint, so this
//   sums every remaining week -- ~2MB per week, which is why the summed
//   result is cached rather than the raw responses.
// - CBS: its public rest-of-season projections pages, one per position
//   (top 100 players at QB/RB/WR/TE, every K and D/ST), parsed from HTML.
//   A redesign on their end would break the parser; failures surface as
//   an error banner and the trade page falls back to ESPN.

export type ProjectionSource = "espn" | "sleeper" | "cbs" | "consensus";

export const PROJECTION_SOURCES: { id: ProjectionSource; label: string }[] = [
  { id: "espn", label: "ESPN" },
  { id: "sleeper", label: "Sleeper" },
  { id: "cbs", label: "CBS" },
  { id: "consensus", label: "Consensus" },
];

export function parseProjectionSource(value: string | undefined): ProjectionSource {
  return PROJECTION_SOURCES.some((s) => s.id === value) ? (value as ProjectionSource) : "espn";
}

// Each source's rest-of-season projection for one player; a source that
// doesn't cover the player is left out.
export interface SourceProjections {
  espn: number;
  sleeper?: number;
  cbs?: number;
}

interface ExternalProjection {
  name: string;
  position: string; // ESPN-style: QB, RB, WR, TE, K, D/ST
  team: string; // ESPN-style abbreviation
  points: number;
}

const CACHE_SECONDS = 3600;

// ESPN and the other sources disagree on a couple of team codes.
const TEAM_ALIASES: Record<string, string> = { WAS: "WSH", JAC: "JAX" };
const espnTeam = (team: string) => TEAM_ALIASES[team] ?? team;

// "Kenneth Walker III" / "Kenneth Walker", "D'Andre Swift" / "DAndre
// Swift" -- lowercase, drop punctuation and generational suffixes.
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/, "")
    .replace(/\s+/g, "");
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const SLEEPER_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DEF"];

async function loadSleeper(
  season: number,
  fromWeek: number,
  toWeek: number
): Promise<ExternalProjection[]> {
  const query = SLEEPER_POSITIONS.map((p) => `position[]=${p}`).join("&");
  const weeks = Array.from({ length: toWeek - fromWeek + 1 }, (_, i) => fromWeek + i);
  const responses = await Promise.all(
    weeks.map(async (week) => {
      const res = await fetch(
        `https://api.sleeper.app/projections/nfl/${season}/${week}?season_type=regular&${query}`,
        { cache: "no-store" } // too large for the fetch cache; the sum is cached instead
      );
      if (!res.ok) throw new Error(`Sleeper returned ${res.status} for week ${week}`);
      return (await res.json()) as {
        player_id: string;
        team: string | null;
        player: { first_name?: string; last_name?: string; position?: string };
        stats: { pts_ppr?: number };
      }[];
    })
  );

  const byPlayer = new Map<string, ExternalProjection>();
  for (const rows of responses) {
    for (const row of rows) {
      const points = row.stats?.pts_ppr ?? 0;
      if (!points) continue;
      const isDefense = row.player.position === "DEF";
      const existing = byPlayer.get(row.player_id);
      if (existing) {
        existing.points += points;
        continue;
      }
      byPlayer.set(row.player_id, {
        name: `${row.player.first_name ?? ""} ${row.player.last_name ?? ""}`.trim(),
        position: isDefense ? "D/ST" : row.player.position ?? "",
        // A defense's player_id is its team code.
        team: espnTeam(isDefense ? row.player_id : row.team ?? ""),
        points,
      });
    }
  }
  return [...byPlayer.values()].map((p) => ({ ...p, points: round1(p.points) }));
}

const CBS_POSITIONS: [string, string][] = [
  ["QB", "QB"],
  ["RB", "RB"],
  ["WR", "WR"],
  ["TE", "TE"],
  ["K", "K"],
  ["DST", "D/ST"],
];

const stripTags = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function parseCbsPage(html: string, position: string): ExternalProjection[] {
  const headers = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) =>
    stripTags(m[1]).split(" ")[0]
  );
  // Header rows include group labels ("Rushing", ...) before the column
  // headers; fpts's position among the body cells is its position among
  // the headers that come after the "Player"/"Team" column.
  const firstColumn = headers.findIndex((h) => h === "Player" || h === "Team");
  const fptsIndex = headers.indexOf("fpts") - firstColumn;
  if (firstColumn === -1 || fptsIndex <= 0) throw new Error(`CBS ${position} page layout changed`);

  const rows = [...html.matchAll(/<tr class="TableBase-bodyTr[\s\S]*?<\/tr>/g)].map((m) => m[0]);
  return rows.flatMap((row) => {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    const points = Number(stripTags(cells[fptsIndex] ?? ""));
    if (!Number.isFinite(points)) return [];
    if (position === "D/ST") {
      const team = row.match(/\/nfl\/teams\/([A-Z]+)\//)?.[1];
      return team ? [{ name: team, position, team: espnTeam(team), points }] : [];
    }
    const long = row.match(/CellPlayerName--long[\s\S]*?<a[^>]*>([^<]+)<\/a>/)?.[1];
    const team = row.match(/CellPlayerName--long[\s\S]*?CellPlayerName-team">\s*([A-Z]+)/)?.[1];
    return long ? [{ name: long.trim(), position, team: espnTeam(team ?? ""), points }] : [];
  });
}

async function loadCbs(season: number): Promise<ExternalProjection[]> {
  const pages = await Promise.all(
    CBS_POSITIONS.map(async ([cbsPosition, position]) => {
      const res = await fetch(
        `https://www.cbssports.com/fantasy/football/stats/${cbsPosition}/${season}/restofseason/projections/ppr/`,
        { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }
      );
      if (!res.ok) throw new Error(`CBS returned ${res.status} for ${cbsPosition}`);
      return parseCbsPage(await res.text(), position);
    })
  );
  return pages.flat();
}

const cachedSleeper = unstable_cache(loadSleeper, ["sleeper-ros"], { revalidate: CACHE_SECONDS });
const cachedCbs = unstable_cache(loadCbs, ["cbs-ros"], { revalidate: CACHE_SECONDS });

// Finds a player's projection in one source's list: D/ST by team, everyone
// else by name + position, using team only to pick between same-named
// players (team alone can't be required -- players change teams).
function buildMatcher(rows: ExternalProjection[]) {
  const index = new Map<string, ExternalProjection[]>();
  for (const row of rows) {
    const key = row.position === "D/ST" ? `D/ST|${row.team}` : `${row.position}|${normalizeName(row.name)}`;
    index.set(key, [...(index.get(key) ?? []), row]);
  }
  return (p: RosterPlayer): number | undefined => {
    const key = p.position === "D/ST" ? `D/ST|${p.proTeam}` : `${p.position}|${normalizeName(p.name)}`;
    const matches = index.get(key) ?? [];
    const match = matches.length > 1 ? matches.find((m) => m.team === p.proTeam) ?? matches[0] : matches[0];
    return match?.points;
  };
}

/**
 * Looks up every source's rest-of-season projection for `players`.
 * Sources that fail to load are reported in `errors` and simply left out
 * of the result, so the page still works on ESPN alone.
 */
export async function getSourceProjections(
  players: RosterPlayer[],
  season: number,
  currentWeek: number,
  lastWeek: number
): Promise<{ bySource: Map<number, SourceProjections>; errors: string[] }> {
  const errors: string[] = [];
  const settle = async (name: string, load: () => Promise<ExternalProjection[]>) => {
    try {
      return buildMatcher(await load());
    } catch (err) {
      console.error(`[projections] ${name} failed:`, err);
      errors.push(`${name} projections couldn't be loaded, so they're left out.`);
      return null;
    }
  };
  const [sleeper, cbs] = await Promise.all([
    settle("Sleeper", () => cachedSleeper(season, currentWeek, lastWeek)),
    settle("CBS", () => cachedCbs(season)),
  ]);

  const bySource = new Map<number, SourceProjections>();
  for (const p of players) {
    bySource.set(p.playerId, { espn: p.projectedPoints, sleeper: sleeper?.(p), cbs: cbs?.(p) });
  }
  return { bySource, errors };
}

/**
 * The projection to use for one source. A single source that doesn't
 * cover the player falls back to ESPN (flagged via `fellBack`); consensus
 * averages whichever sources do cover them.
 */
export function projectionFor(
  values: SourceProjections,
  source: ProjectionSource
): { points: number; fellBack: boolean } {
  if (source === "espn") return { points: values.espn, fellBack: false };
  if (source === "consensus") {
    const all = [values.espn, values.sleeper, values.cbs].filter((v): v is number => v !== undefined);
    return { points: round1(all.reduce((s, v) => s + v, 0) / all.length), fellBack: false };
  }
  const value = values[source];
  return value === undefined ? { points: values.espn, fellBack: true } : { points: value, fellBack: false };
}
