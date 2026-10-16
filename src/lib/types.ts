export interface Member {
  id: string;
  displayName: string;
}

export interface RosterPlayer {
  playerId: number;
  name: string;
  position: string; // e.g. "RB"
  isFlexEligible: boolean;
  proTeam: string; // e.g. "KC"
  lineupSlot: string; // e.g. "Bench", "FLEX"
  injuryStatus: string; // short code, "" if healthy/unknown
  seasonPoints: number;
  projectedPoints: number;
  avgPoints: number; // season points / games actually played; 0 pre-season
}

export interface Team {
  id: number;
  name: string;
  abbrev: string;
  logo: string | null;
  ownerIds: string[];
  ownerNames: string[];
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  playoffSeed: number | null;
  draftPosition: number | null; // round-1 slot in the snake draft; null if not drafted yet
  roster: RosterPlayer[];
}

export interface League {
  leagueId: string;
  name: string;
  seasonYear: number;
  currentWeek: number; // ESPN's own "what week is it" (Wed-Tue boundary)
  totalWeeks: number; // last scoring period of the season, for a week picker's range
  // Starting lineup shape, slot name -> how many start there (e.g. RB: 2,
  // FLEX: 1). Starter slots only -- no Bench/IR.
  lineupSlotCounts: Record<string, number>;
  rosterSize: number; // max players per team, not counting IR
  members: Member[];
  teams: Team[];
}

// A single week's actual + projected points for one player.
export interface WeeklyPoints {
  points: number;
  projected: number;
}

// One axis of the "Position Strength" radar chart: how this team's
// starters at this position rank against the same league's other teams.
export interface PositionAxisRank {
  axis: string; // "QB" | "RB" | "WR" | "TE" | "FLEX" | "D/ST" | "K"
  starterRank: number; // 1 = best in the league
  starterValue: number;
  totalTeams: number;
}

// One bar of the "Starting Lineup" chart: a specific starter, and how
// their season-long projection ranks against every other starter at the
// same true position in the same league.
export interface StarterRankInfo {
  slotLabel: string; // "QB", "RB1", "RB2", "WR1", "FLEX", "K", "D/ST", ...
  axis: string; // slotLabel without the number, e.g. "RB1" -> "RB" -- the comparison pool
  player: RosterPlayer;
  points: number; // season or week projected points, whichever this was computed for
  positionRank: number; // 1 = best in the league, within that pool
  totalAtPosition: number;
}

// One row of the Compare page's Power Rankings table: a team's overall
// score (see getLeaguePowerScores) for one Season/Wk N mode.
export interface PowerRankingEntry {
  key: string; // `${leagueId}::${teamId}`, matches CompareTeamOption.key
  teamName: string;
  score: number; // 0-100, higher = stronger
}

// One team's week-by-week actual points, one entry per completed week
// (same length/order as CumulativePointsData.weeks). `points` is the
// season-to-date running total through that week; `weeklyPoints` is that
// week's score on its own, un-accumulated -- the chart toggles between
// plotting one or the other.
export interface CumulativePointsSeries {
  teamId: number;
  teamName: string;
  points: number[];
  weeklyPoints: number[];
}

// Data for the Standings page's cumulative-points-by-week line chart.
// `weeks` only covers completed weeks -- the
// in-progress current week's score isn't final yet, so it's left off
// rather than shown as a partial/misleading data point.
export interface CumulativePointsData {
  weeks: number[];
  series: CumulativePointsSeries[];
}

export interface DashboardData {
  leagues: League[];
  isDemoData: boolean;
  errors: { leagueName: string; message: string }[];
}

// One entry from ESPN's wider player pool (kona_player_info) -- covers the
// whole NFL player universe, not just players on one of your rosters.
export interface PoolPlayer {
  playerId: number;
  name: string;
  position: string;
  isFlexEligible: boolean;
  proTeam: string;
  injuryStatus: string;
  seasonPoints: number;
  projectedPoints: number;
  avgPoints: number; // season points / games actually played; 0 pre-season
  percentOwned: number; // ESPN-wide ownership %, not specific to your league
}

// Which team in the league has a player rostered, and in what slot.
export interface RosterSpot {
  teamName: string;
  ownerNames: string[];
  lineupSlot: string;
}

// Flattened row used by the player-rankings view: every rostered player,
// plus the wider free-agent pool, in one list.
export interface RankedPlayer extends PoolPlayer {
  isRostered: boolean;
  rosterSpot: RosterSpot | null; // null for a free agent
}
