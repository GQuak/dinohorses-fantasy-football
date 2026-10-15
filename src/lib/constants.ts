// Reverse-engineered ESPN Fantasy Football API mappings.
// ESPN's Fantasy API is not officially documented; these tables are the
// commonly-used community mappings (see cwendt94/espn-api and similar
// projects). If a real league response ever shows an id missing here, the
// UI falls back to showing the raw numeric id instead of guessing wrong.

// Player's actual NFL position (player.defaultPositionId)
export const DEFAULT_POSITION_MAP: Record<number, string> = {
  1: "QB",
  2: "RB",
  3: "WR",
  4: "TE",
  5: "K",
  16: "D/ST",
};

// The set of positions that count as "FLEX" for the rankings filter.
export const FLEX_POSITIONS = ["RB", "WR", "TE"];

// Canonical display order for starting lineup slots (Team detail page).
// ESPN's roster API doesn't return entries in this order, so sort with it
// explicitly rather than trusting API order. Any slot not listed here
// (rare/league-specific ones) sorts to the end, in whatever order it
// arrived in.
export const STARTER_SLOT_ORDER = ["QB", "RB", "WR", "TE", "FLEX", "D/ST", "K"];

export function starterSlotSortIndex(lineupSlot: string): number {
  const i = STARTER_SLOT_ORDER.indexOf(lineupSlot);
  return i === -1 ? STARTER_SLOT_ORDER.length : i;
}

// Radar chart axes for the "Position Strength" chart -- same set as the
// starter lineup slots. "FLEX" isn't a real position, so the Bench series
// (grouped by a player's true position) never has anything on that axis --
// expected, not a bug.
export const POSITION_AXES = STARTER_SLOT_ORDER;

// Per-axis weight for the Power Rankings score (see getLeaguePowerScores):
// RB and WR each start two starters (RB1+RB2, WR1+WR2) while every other
// axis starts exactly one, so they count double -- a #1 RB rank
// contributes 200 (2 x 100) into the weighted sum instead of 100. Weights
// sum to 9, which is what the total gets divided by (not POSITION_AXES.
// length, 7) to keep the final score on a 0-100 scale.
export const POSITION_AXIS_WEIGHTS: Record<string, number> = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  FLEX: 1,
  "D/ST": 1,
  K: 1,
};

// Roster slot a player is currently occupying (rosterEntry.lineupSlotId)
export const LINEUP_SLOT_MAP: Record<number, string> = {
  0: "QB",
  2: "RB",
  4: "WR",
  6: "TE",
  7: "OP",
  16: "D/ST",
  17: "K",
  20: "Bench",
  21: "IR",
  23: "FLEX",
};

// player.injuryStatus
export const INJURY_STATUS_MAP: Record<string, string> = {
  ACTIVE: "",
  QUESTIONABLE: "Q",
  DOUBTFUL: "D",
  OUT: "O",
  INJURY_RESERVE: "IR",
  SUSPENSION: "SUSP",
};

// player.proTeamId -> NFL team abbreviation
export const PRO_TEAM_MAP: Record<number, string> = {
  0: "FA",
  1: "ATL",
  2: "BUF",
  3: "CHI",
  4: "CIN",
  5: "CLE",
  6: "DAL",
  7: "DEN",
  8: "DET",
  9: "GB",
  10: "TEN",
  11: "IND",
  12: "KC",
  13: "LV",
  14: "LAR",
  15: "MIA",
  16: "MIN",
  17: "NE",
  18: "NO",
  19: "NYG",
  20: "NYJ",
  21: "PHI",
  22: "ARI",
  23: "PIT",
  24: "LAC",
  25: "SF",
  26: "SEA",
  27: "TB",
  28: "WSH",
  29: "CAR",
  30: "JAX",
  33: "BAL",
  34: "HOU",
};

// Short label for a league's full display name, e.g. "Adswerve League -
// EAST" -> "EAST". Falls back to the full name for a league name that
// doesn't follow the "<name> - <short>" convention (no dash to split on).
export function leagueShortName(name: string): string {
  const idx = name.lastIndexOf("-");
  return idx === -1 ? name : name.slice(idx + 1).trim();
}

export function positionName(defaultPositionId: number): string {
  return DEFAULT_POSITION_MAP[defaultPositionId] ?? `POS ${defaultPositionId}`;
}

export function lineupSlotName(lineupSlotId: number): string {
  return LINEUP_SLOT_MAP[lineupSlotId] ?? `SLOT ${lineupSlotId}`;
}

export function proTeamAbbrev(proTeamId: number): string {
  return PRO_TEAM_MAP[proTeamId] ?? "—";
}

// Public ESPN CDN paths -- no auth needed, same ones espn.com itself uses.
export function playerHeadshotUrl(playerId: number): string {
  return `https://a.espncdn.com/i/headshots/nfl/players/full/${playerId}.png`;
}

export function teamLogoUrl(proTeamAbbrevValue: string): string {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${proTeamAbbrevValue.toLowerCase()}.png`;
}
