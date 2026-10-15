// Hand-curated weekly recaps -- unlike the rest of the app, this data isn't
// fetched live. Each entry is a snapshot of one week's actual-vs-projected
// starter totals (same live-computed method as the team page's Total row)
// plus editorial picks (standouts, free agents, facts) put together after
// the week closes. Add a new entry per week; getLatestRecap() always shows
// the most recent one.

export interface RecapTeamRow {
  team: string;
  actual: number;
  projected: number;
}

export interface RecapCard {
  kind: "boom" | "bust";
  offBench?: boolean;
  name: string;
  position: string;
  proTeam: string;
  actual: number;
  projected: number;
  note: string;
}

export interface RecapFreeAgent {
  name: string;
  position: string;
  proTeam: string;
  percentOwned: number;
  actual: number;
}

export interface WeeklyRecap {
  week: number;
  seasonYear: number;
  headline: {
    topScoreTeam: string;
    topScoreLeague: "EAST" | "WEST";
    topScore: number;
    biggestBeatTeam: string;
    biggestBeatLeague: "EAST" | "WEST";
    biggestBeat: number;
    biggestBustTeam: string;
    biggestBustLeague: "EAST" | "WEST";
    biggestBust: number;
  };
  east: { teams: RecapTeamRow[]; notes: string[] };
  west: { teams: RecapTeamRow[]; notes: string[] };
  standouts: RecapCard[];
  freeAgents: RecapFreeAgent[];
  facts: string[];
}

export const WEEKLY_RECAPS: WeeklyRecap[] = [];

export function getLatestRecap(): WeeklyRecap | null {
  return WEEKLY_RECAPS.length > 0 ? WEEKLY_RECAPS[WEEKLY_RECAPS.length - 1] : null;
}

export function getRecapByWeek(week: number): WeeklyRecap | null {
  return WEEKLY_RECAPS.find((r) => r.week === week) ?? null;
}
