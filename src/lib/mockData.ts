import type { CumulativePointsData, League, RankedPlayer, WeeklyPoints } from "./types";

// Sample data shown when ESPN league env vars aren't configured yet, so the
// dashboard is fully browsable (and previewable) before you've plugged in
// real league IDs/cookies. See README for how to switch to live data.

let mockPlayerIdCounter = 1;

// Every mock team's record (wins + losses + ties) sums to 9 -- see the
// team definitions below -- so 9 stands in for "games played" here.
const MOCK_GAMES_PLAYED = 9;

function roster(
  entries: [string, string, string, string, number][]
): League["teams"][number]["roster"] {
  return entries.map(([name, position, proTeam, lineupSlot, seasonPoints]) => ({
    playerId: mockPlayerIdCounter++,
    name,
    position,
    isFlexEligible: ["RB", "WR", "TE"].includes(position),
    proTeam,
    lineupSlot,
    injuryStatus: "",
    seasonPoints,
    projectedPoints: Math.round(seasonPoints * 1.05 * 10) / 10,
    avgPoints: Math.round((seasonPoints / MOCK_GAMES_PLAYED) * 10) / 10,
  }));
}

export const MOCK_LEAGUES: League[] = [
  {
    leagueId: "demo-1",
    name: "The League of Extraordinary Gentlemen",
    seasonYear: 2026,
    currentWeek: 9,
    totalWeeks: 17,
    members: [
      { id: "m1", displayName: "Alex Kim" },
      { id: "m2", displayName: "Jordan Reyes" },
      { id: "m3", displayName: "Sam Patel" },
      { id: "m4", displayName: "Taylor Brooks" },
    ],
    teams: [
      {
        id: 1,
        name: "Gridiron Gladiators",
        abbrev: "GRID",
        logo: null,
        ownerIds: ["m1"],
        ownerNames: ["Alex Kim"],
        wins: 7,
        losses: 2,
        ties: 0,
        pointsFor: 1142.4,
        pointsAgainst: 1001.2,
        playoffSeed: 1,
        draftPosition: 3,
        roster: roster([
          ["Josh Allen", "QB", "BUF", "QB", 214.6],
          ["Bijan Robinson", "RB", "ATL", "RB", 178.3],
          ["Breece Hall", "RB", "NYJ", "FLEX", 149.7],
          ["CeeDee Lamb", "WR", "DAL", "WR", 165.2],
          ["Amon-Ra St. Brown", "WR", "DET", "WR", 158.9],
          ["Sam LaPorta", "TE", "DET", "TE", 121.4],
          ["Harrison Butker", "K", "KC", "K", 98.1],
          ["49ers D/ST", "D/ST", "SF", "D/ST", 87.5],
          ["Jaylen Warren", "RB", "PIT", "Bench", 62.0],
          ["Tank Dell", "WR", "HOU", "Bench", 54.2],
        ]),
      },
      {
        id: 2,
        name: "Waiver Wire Warriors",
        abbrev: "WWW",
        logo: null,
        ownerIds: ["m2"],
        ownerNames: ["Jordan Reyes"],
        wins: 6,
        losses: 3,
        ties: 0,
        pointsFor: 1089.9,
        pointsAgainst: 1043.5,
        playoffSeed: 2,
        draftPosition: 1,
        roster: roster([
          ["Lamar Jackson", "QB", "BAL", "QB", 231.8],
          ["Jahmyr Gibbs", "RB", "DET", "RB", 172.1],
          ["De'Von Achane", "RB", "MIA", "FLEX", 138.9],
          ["Justin Jefferson", "WR", "MIN", "WR", 171.6],
          ["Garrett Wilson", "WR", "NYJ", "WR", 132.4],
          ["Trey McBride", "TE", "ARI", "TE", 118.7],
          ["Brandon Aubrey", "K", "DAL", "K", 101.3],
          ["Ravens D/ST", "D/ST", "BAL", "D/ST", 79.8],
          ["Rachaad White", "RB", "TB", "Bench", 58.4],
          ["Rome Odunze", "WR", "CHI", "Bench", 49.9],
        ]),
      },
      {
        id: 3,
        name: "Hail Mary Heroes",
        abbrev: "HAIL",
        logo: null,
        ownerIds: ["m3"],
        ownerNames: ["Sam Patel"],
        wins: 4,
        losses: 5,
        ties: 0,
        pointsFor: 967.3,
        pointsAgainst: 1012.6,
        playoffSeed: 5,
        draftPosition: 4,
        roster: roster([
          ["Jordan Love", "QB", "GB", "QB", 189.2],
          ["Kyren Williams", "RB", "LAR", "RB", 151.0],
          ["James Cook", "RB", "BUF", "FLEX", 132.6],
          ["Drake London", "WR", "ATL", "WR", 128.8],
          ["DK Metcalf", "WR", "SEA", "WR", 119.5],
          ["Dalton Kincaid", "TE", "BUF", "TE", 89.3],
          ["Jake Elliott", "K", "PHI", "K", 92.0],
          ["Jets D/ST", "D/ST", "NYJ", "D/ST", 71.2],
          ["Tyjae Spears", "RB", "TEN", "Bench", 47.1],
          ["Jayden Reed", "WR", "GB", "Bench", 55.6],
        ]),
      },
      {
        id: 4,
        name: "Fumble Bees",
        abbrev: "FMBL",
        logo: null,
        ownerIds: ["m4"],
        ownerNames: ["Taylor Brooks"],
        wins: 3,
        losses: 6,
        ties: 0,
        pointsFor: 891.7,
        pointsAgainst: 1078.9,
        playoffSeed: 7,
        draftPosition: 2,
        roster: roster([
          ["Dak Prescott", "QB", "DAL", "QB", 176.4],
          ["Joe Mixon", "RB", "HOU", "RB", 124.8,],
          ["Rhamondre Stevenson", "RB", "NE", "FLEX", 98.2],
          ["Chris Olave", "WR", "NO", "WR", 112.3],
          ["Tank Bigsby", "WR", "JAX", "WR", 78.9],
          ["Evan Engram", "TE", "JAX", "TE", 76.5],
          ["Younghoe Koo", "K", "ATL", "K", 87.4],
          ["Browns D/ST", "D/ST", "CLE", "D/ST", 68.9],
          ["Zach Charbonnet", "RB", "SEA", "Bench", 41.6],
          ["Wan'Dale Robinson", "WR", "NYG", "Bench", 46.3],
        ]),
      },
    ],
  },
  {
    leagueId: "demo-2",
    name: "Dynasty Dumpster Fire",
    seasonYear: 2026,
    currentWeek: 9,
    totalWeeks: 17,
    members: [
      { id: "m5", displayName: "Morgan Diaz" },
      { id: "m6", displayName: "Casey Nguyen" },
      { id: "m7", displayName: "Riley Foster" },
      { id: "m8", displayName: "Quinn Alvarez" },
    ],
    teams: [
      {
        id: 1,
        name: "Cardiac Kids",
        abbrev: "CARD",
        logo: null,
        ownerIds: ["m5"],
        ownerNames: ["Morgan Diaz"],
        wins: 8,
        losses: 1,
        ties: 0,
        pointsFor: 1201.5,
        pointsAgainst: 987.4,
        playoffSeed: 1,
        draftPosition: 2,
        roster: roster([
          ["Patrick Mahomes", "QB", "KC", "QB", 221.9],
          ["Saquon Barkley", "RB", "PHI", "RB", 198.7],
          ["Isiah Pacheco", "RB", "KC", "FLEX", 111.4],
          ["A.J. Brown", "WR", "PHI", "WR", 149.8],
          ["Mike Evans", "WR", "TB", "WR", 138.1],
          ["George Kittle", "TE", "SF", "TE", 127.9],
          ["Justin Tucker", "K", "BAL", "K", 103.6],
          ["Cowboys D/ST", "D/ST", "DAL", "D/ST", 82.0],
          ["Javonte Williams", "RB", "DAL", "Bench", 55.9],
          ["Xavier Worthy", "WR", "KC", "Bench", 61.2],
        ]),
      },
      {
        id: 2,
        name: "Third and Long",
        abbrev: "3RDL",
        logo: null,
        ownerIds: ["m6"],
        ownerNames: ["Casey Nguyen"],
        wins: 5,
        losses: 4,
        ties: 0,
        pointsFor: 1032.6,
        pointsAgainst: 1015.8,
        playoffSeed: 3,
        draftPosition: 4,
        roster: roster([
          ["C.J. Stroud", "QB", "HOU", "QB", 196.3],
          ["Derrick Henry", "RB", "BAL", "RB", 165.9],
          ["Aaron Jones", "RB", "MIN", "FLEX", 121.6],
          ["Puka Nacua", "WR", "LAR", "WR", 144.7],
          ["Brian Thomas Jr.", "WR", "JAX", "WR", 118.2],
          ["Jonnu Smith", "TE", "PIT", "TE", 84.6],
          ["Cameron Dicker", "K", "LAC", "K", 95.8],
          ["Steelers D/ST", "D/ST", "PIT", "D/ST", 76.4],
          ["Najee Harris", "RB", "PIT", "Bench", 52.0],
          ["Jameson Williams", "WR", "DET", "Bench", 63.1],
        ]),
      },
      {
        id: 3,
        name: "Two Minute Drill",
        abbrev: "TMD",
        logo: null,
        ownerIds: ["m7"],
        ownerNames: ["Riley Foster"],
        wins: 4,
        losses: 5,
        ties: 0,
        pointsFor: 978.1,
        pointsAgainst: 1001.0,
        playoffSeed: 6,
        draftPosition: 1,
        roster: roster([
          ["Trevor Lawrence", "QB", "JAX", "QB", 168.4],
          ["Alvin Kamara", "RB", "NO", "RB", 142.3],
          ["Tony Pollard", "RB", "TEN", "FLEX", 108.9],
          ["Tee Higgins", "WR", "CIN", "WR", 121.7],
          ["Courtland Sutton", "WR", "DEN", "WR", 104.5],
          ["Pat Freiermuth", "TE", "PIT", "TE", 79.8],
          ["Chris Boswell", "K", "PIT", "K", 90.2],
          ["Texans D/ST", "D/ST", "HOU", "D/ST", 74.1],
          ["Tyrone Tracy Jr.", "RB", "NYG", "Bench", 48.7],
          ["Khalil Shakir", "WR", "BUF", "Bench", 51.4],
        ]),
      },
      {
        id: 4,
        name: "Kickoff Return Kings",
        abbrev: "KRK",
        logo: null,
        ownerIds: ["m8"],
        ownerNames: ["Quinn Alvarez"],
        wins: 2,
        losses: 7,
        ties: 0,
        pointsFor: 856.2,
        pointsAgainst: 1108.3,
        playoffSeed: 8,
        draftPosition: 3,
        roster: roster([
          ["Kirk Cousins", "QB", "ATL", "QB", 152.1],
          ["Nick Chubb", "RB", "CLE", "RB", 89.6],
          ["Gus Edwards", "RB", "LAC", "FLEX", 76.3],
          ["Diontae Johnson", "WR", "CAR", "WR", 92.8],
          ["Curtis Samuel", "WR", "BUF", "WR", 74.6],
          ["Cole Kmet", "TE", "CHI", "TE", 68.2],
          ["Matt Gay", "K", "IND", "K", 84.5],
          ["Bears D/ST", "D/ST", "CHI", "D/ST", 62.7],
          ["Antonio Gibson", "RB", "NE", "Bench", 39.8],
          ["Jalen Coker", "WR", "CAR", "Bench", 33.5],
        ]),
      },
    ],
  },
];

// A handful of unrostered players, for demoing the "Free Agent" side of
// Player Rankings without needing real ESPN data.
const MOCK_FREE_AGENTS: [string, string, string, number, number][] = [
  ["Christian McCaffrey", "RB", "SF", 41.2, 210.4],
  ["Cooper Kupp", "WR", "SEA", 38.9, 188.7],
  ["Zay Flowers", "WR", "BAL", 36.1, 145.2],
  ["David Montgomery", "RB", "DET", 33.4, 132.8],
  ["Jayden Daniels", "QB", "WSH", 29.8, 205.6],
  ["Jonathan Taylor", "RB", "IND", 28.5, 168.9],
  ["DeVonta Smith", "WR", "PHI", 26.3, 128.4],
  ["Trey Benson", "RB", "ARI", 24.1, 98.6],
  ["Calvin Ridley", "WR", "TEN", 22.7, 112.3],
  ["Sam Darnold", "QB", "MIN", 19.4, 178.2],
  ["Cade Otton", "TE", "TB", 17.8, 76.5],
  ["Ka'imi Fairbairn", "K", "HOU", 15.2, 88.1],
  ["Eagles D/ST", "D/ST", "PHI", 14.6, 79.3],
  ["Ray Davis", "RB", "BUF", 12.9, 61.7],
  ["Romeo Doubs", "WR", "GB", 11.3, 58.4],
];

export function buildMockPlayerPool(): RankedPlayer[] {
  const rostered: RankedPlayer[] = MOCK_LEAGUES.flatMap((league) =>
    league.teams.flatMap((team) =>
      team.roster.map((p) => ({
        ...p,
        percentOwned: 100,
        isRostered: true,
        rosters: [
          {
            leagueId: league.leagueId,
            leagueName: league.name,
            teamName: team.name,
            ownerNames: team.ownerNames,
            lineupSlot: p.lineupSlot,
          },
        ],
      }))
    )
  );

  const freeAgents: RankedPlayer[] = MOCK_FREE_AGENTS.map(
    ([name, position, proTeam, seasonPoints, projectedPoints], i) => ({
      playerId: 100000 + i,
      name,
      position,
      isFlexEligible: ["RB", "WR", "TE"].includes(position),
      proTeam,
      injuryStatus: "",
      seasonPoints,
      projectedPoints,
      avgPoints: Math.round((seasonPoints / MOCK_GAMES_PLAYED) * 10) / 10,
      percentOwned: Math.max(5, 90 - i * 6),
      isRostered: false,
      rosters: [],
    })
  );

  return [...rostered, ...freeAgents];
}

// Deterministic (seeded by teamId, not random) weekly scores that land a
// team's season-to-date running total in the neighborhood of its own
// pointsFor by the current week -- there's no real week-by-week history in
// demo mode, so this fakes a plausible-looking progression instead.
export function buildMockCumulativePoints(league: League): CumulativePointsData {
  const lastCompletedWeek = Math.max(0, league.currentWeek - 1);
  const weeks = Array.from({ length: lastCompletedWeek }, (_, i) => i + 1);

  const series = league.teams.map((team) => {
    const gamesPlayed = team.wins + team.losses + team.ties || lastCompletedWeek || 1;
    const avgPerWeek = team.pointsFor / gamesPlayed;
    let seed = team.id * 97 + 13;
    const weeklyPoints = weeks.map(() => {
      seed = (seed * 9301 + 49297) % 233280;
      const variance = (seed / 233280 - 0.5) * 30; // +/- 15 points of noise
      return Math.round(Math.max(50, avgPerWeek + variance) * 10) / 10;
    });
    let running = 0;
    const points = weeklyPoints.map((v) => {
      running += v;
      return Math.round(running * 10) / 10;
    });
    return { teamId: team.id, teamName: team.name, points, weeklyPoints };
  });

  return { weeks, series };
}

// Deterministic (seeded by playerId+week, not random) so a given player's
// demo score for a given week stays stable across renders/navigation.
export function buildMockWeeklyPoints(
  playerIds: number[],
  week: number
): Map<number, WeeklyPoints> {
  const map = new Map<number, WeeklyPoints>();
  for (const id of playerIds) {
    const seed = (id * 37 + week * 11) % 30;
    map.set(id, {
      points: Math.round((6 + seed) * 10) / 10,
      projected: Math.round((8 + seed * 0.9) * 10) / 10,
    });
  }
  return map;
}
