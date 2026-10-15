// Hand-curated weekly recaps -- unlike the rest of the app, this data isn't
// fetched live. Each entry is a snapshot of one week's actual-vs-projected
// starter totals (same live-computed method as the team page's Total row)
// plus editorial picks (standouts, free agents, facts) put together after
// the week closes. Add a new entry per week; getLatestRecap() always shows
// the most recent one.

import type { AwardId } from "./awards";

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

// One award earned by one team this week -- see awards.ts for the
// catalog and the curation rules (one entry per team per award per week).
export interface RecapAward {
  award: AwardId;
  team: string;
  note: string; // the specific moment, e.g. "Caleb Williams, 4 pass TDs"
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
    topScore: number;
    biggestBeatTeam: string;
    biggestBeat: number;
    biggestBustTeam: string;
    biggestBust: number;
  };
  teams: RecapTeamRow[];
  notes: string[];
  standouts: RecapCard[];
  freeAgents: RecapFreeAgent[];
  facts: string[];
  awards: RecapAward[];
}

export const WEEKLY_RECAPS: WeeklyRecap[] = [
  {
    week: 1,
    seasonYear: 2026,
    headline: {
      topScoreTeam: "Morning Oatmeal",
      topScore: 177.0,
      biggestBeatTeam: "Morning Oatmeal",
      biggestBeat: 55.4,
      biggestBustTeam: "Porteea McLean",
      biggestBust: -33.3,
    },
    teams: [
      { team: "Morning Oatmeal", actual: 177.0, projected: 121.6 },
      { team: "Baking Out", actual: 161.3, projected: 115.9 },
      { team: "Potato Tomato", actual: 156.1, projected: 117.1 },
      { team: "Pihl Bunyan", actual: 134.5, projected: 119.9 },
      { team: "Joe Buck Yourself", actual: 123.2, projected: 120.5 },
      { team: "Hey Bob", actual: 118.0, projected: 118.3 },
      { team: "Show Me Your TDs", actual: 116.4, projected: 115.2 },
      { team: "Murph Windango", actual: 104.1, projected: 121.4 },
      { team: "Lando Wins", actual: 92.2, projected: 123.7 },
      { team: "Porteea McLean", actual: 89.1, projected: 122.4 },
    ],
    notes: [
      "Morning Oatmeal opened the season with the league's best score, 177.0 (+55.4 on a 121.6 projection), behind Jahmyr Gibbs (33.6), Ashton Jeanty (32.7), Zay Flowers (26.0) and a 19.0-point Steelers D/ST (projected 7.2). Baking Out (161.3) and Potato Tomato (156.1) were the only other teams above 135.",
      "The bottom of the board was rough: Porteea McLean scored 89.1 (-33.3) with Jaylen Waddle at 1.2 and Saquon Barkley at 9.0, and Lando Wins managed 92.2 after Colston Loveland (0.0) and the Browns D/ST (-1.0) finished at or below zero.",
    ],
    standouts: [
      {
        kind: "boom",
        name: "Caleb Williams",
        position: "QB",
        proTeam: "CHI",
        actual: 37.3,
        projected: 16.4,
        note: "Baking Out · week's top score",
      },
      {
        kind: "boom",
        name: "D'Andre Swift",
        position: "RB",
        proTeam: "CHI",
        actual: 32.4,
        projected: 12.3,
        note: "Pihl Bunyan",
      },
      {
        kind: "boom",
        name: "Kenneth Walker III",
        position: "RB",
        proTeam: "KC",
        actual: 34.1,
        projected: 14.7,
        note: "Baking Out",
      },
      {
        kind: "boom",
        name: "Derrick Henry",
        position: "RB",
        proTeam: "BAL",
        actual: 35.3,
        projected: 16.4,
        note: "Potato Tomato",
      },
      {
        kind: "boom",
        offBench: true,
        name: "Christian Watson",
        position: "WR",
        proTeam: "GB",
        actual: 32.7,
        projected: 10.9,
        note: "Benched by Baking Out",
      },
      {
        kind: "bust",
        name: "Ja'Marr Chase",
        position: "WR",
        proTeam: "CIN",
        actual: 3.2,
        projected: 19.9,
        note: "Murph Windango",
      },
      {
        kind: "bust",
        name: "Colston Loveland",
        position: "TE",
        proTeam: "CHI",
        actual: 0.0,
        projected: 12.0,
        note: "Lando Wins",
      },
      {
        kind: "bust",
        name: "Jaylen Waddle",
        position: "WR",
        proTeam: "DEN",
        actual: 1.2,
        projected: 12.2,
        note: "Porteea McLean",
      },
    ],
    freeAgents: [],
    awards: [
      { award: "apex-predator", team: "Morning Oatmeal", note: "177.0 points, the week's top score" },
      { award: "jurassic-park", team: "Baking Out", note: "161.3 points" },
      { award: "jurassic-park", team: "Morning Oatmeal", note: "177.0 points" },
      { award: "jurassic-park", team: "Potato Tomato", note: "156.1 points" },
      { award: "extinction-event", team: "Morning Oatmeal", note: "Beat Murph Windango by 72.8" },
      { award: "extinction-event", team: "Potato Tomato", note: "Beat Porteea McLean by 67.0" },
      { award: "fossilized", team: "Porteea McLean", note: "89.1 points, the week's lowest score" },
      { award: "wrong-fossil", team: "Baking Out", note: "Christian Watson scored 32.7 on the bench" },
      { award: "t-rex-arm", team: "Joe Buck Yourself", note: "Trevor Lawrence, 4 pass TDs" },
    ],
    facts: [
      "Baking Out left 72.4 points on its bench — Christian Watson 32.7, Kyle Monangai 20.4 and Parker Washington 19.3 — and still finished second.",
      "Three teams cleared 155 points; the other seven were all under 135.",
      "Caleb Williams' 37.3 points (projected 16.4) was the week's top individual score, and it came for Baking Out alongside Kenneth Walker III's 34.1.",
    ],
  },
  {
    week: 2,
    seasonYear: 2026,
    headline: {
      topScoreTeam: "Show Me Your TDs",
      topScore: 141.0,
      biggestBeatTeam: "Show Me Your TDs",
      biggestBeat: 15.3,
      biggestBustTeam: "Porteea McLean",
      biggestBust: -24.1,
    },
    teams: [
      { team: "Show Me Your TDs", actual: 141.0, projected: 125.7 },
      { team: "Hey Bob", actual: 128.9, projected: 121.6 },
      { team: "Murph Windango", actual: 125.4, projected: 121.1 },
      { team: "Pihl Bunyan", actual: 121.5, projected: 121.9 },
      { team: "Morning Oatmeal", actual: 116.1, projected: 128.1 },
      { team: "Lando Wins", actual: 110.9, projected: 121.3 },
      { team: "Joe Buck Yourself", actual: 108.6, projected: 115.2 },
      { team: "Baking Out", actual: 108.1, projected: 124.4 },
      { team: "Potato Tomato", actual: 107.0, projected: 129.1 },
      { team: "Porteea McLean", actual: 75.1, projected: 99.2 },
    ],
    notes: [
      "Show Me Your TDs jumped from 7th to 1st with 141.0 (+15.3): Josh Allen's 40.8 (projected 22.7) and a 20.0-point Patriots D/ST carried a lineup that otherwise got just 8.5 from Justin Jefferson and 1.0 from kicker Cameron Dicker.",
      "The Week 1 leaders all fell hard: Morning Oatmeal dropped 60.9 points from last week, Baking Out 53.2 and Potato Tomato 49.1 — Potato Tomato got 0.8 from Jaxson Dart and 1.1 from Malik Nabers.",
    ],
    standouts: [
      {
        kind: "boom",
        name: "Jaxon Smith-Njigba",
        position: "WR",
        proTeam: "SEA",
        actual: 42.5,
        projected: 18.5,
        note: "Joe Buck Yourself · week's top score",
      },
      {
        kind: "boom",
        name: "Davante Adams",
        position: "WR",
        proTeam: "LAR",
        actual: 39.5,
        projected: 15.5,
        note: "Murph Windango",
      },
      {
        kind: "boom",
        name: "Josh Allen",
        position: "QB",
        proTeam: "BUF",
        actual: 40.8,
        projected: 22.7,
        note: "Show Me Your TDs",
      },
      {
        kind: "boom",
        name: "CeeDee Lamb",
        position: "WR",
        proTeam: "DAL",
        actual: 35.3,
        projected: 18.0,
        note: "Pihl Bunyan",
      },
      {
        kind: "boom",
        offBench: true,
        name: "Travis Kelce",
        position: "TE",
        proTeam: "KC",
        actual: 25.1,
        projected: 10.5,
        note: "Benched by Porteea McLean",
      },
      {
        kind: "bust",
        name: "Jaxson Dart",
        position: "QB",
        proTeam: "NYG",
        actual: 0.8,
        projected: 18.2,
        note: "Potato Tomato",
      },
      {
        kind: "bust",
        name: "Saquon Barkley",
        position: "RB",
        proTeam: "PHI",
        actual: 3.0,
        projected: 17.6,
        note: "Porteea McLean",
      },
      {
        kind: "bust",
        name: "Malik Nabers",
        position: "WR",
        proTeam: "NYG",
        actual: 1.1,
        projected: 14.9,
        note: "Potato Tomato",
      },
    ],
    freeAgents: [],
    awards: [
      { award: "apex-predator", team: "Show Me Your TDs", note: "141.0 points, the week's top score" },
      { award: "fossilized", team: "Porteea McLean", note: "75.1 points, the week's lowest score" },
      { award: "perfect-lineup", team: "Baking Out", note: "108.1 points, the most possible from the roster" },
      { award: "perfect-lineup", team: "Lando Wins", note: "110.9 points, the most possible from the roster" },
      { award: "perfect-lineup", team: "Morning Oatmeal", note: "116.1 points, the most possible from the roster" },
      { award: "perfect-lineup", team: "Murph Windango", note: "125.4 points, the most possible from the roster" },
      { award: "t-rex-arm", team: "Lando Wins", note: "Dak Prescott, 4 pass TDs" },
      { award: "raptor-speed", team: "Joe Buck Yourself", note: "Jaxon Smith-Njigba scored 42.5" },
      { award: "raptor-speed", team: "Show Me Your TDs", note: "Josh Allen scored 40.8" },
    ],
    facts: [
      "Potato Tomato's Jaxson Dart and Malik Nabers combined for 1.9 points against a 33.1 projection.",
      "Porteea McLean's 75.1 was the week's low (-24.1 off projection), and Travis Kelce (25.1) and Stefon Diggs (21.7) scored 46.8 points on its bench.",
      "Jaxon Smith-Njigba's 42.5 (projected 18.5) was the week's top individual score, for Joe Buck Yourself.",
    ],
  },
  {
    week: 3,
    seasonYear: 2026,
    headline: {
      topScoreTeam: "Joe Buck Yourself",
      topScore: 146.2,
      biggestBeatTeam: "Joe Buck Yourself",
      biggestBeat: 24.5,
      biggestBustTeam: "Pihl Bunyan",
      biggestBust: -30.3,
    },
    teams: [
      { team: "Joe Buck Yourself", actual: 146.2, projected: 121.7 },
      { team: "Show Me Your TDs", actual: 140.0, projected: 129.9 },
      { team: "Murph Windango", actual: 139.4, projected: 119.8 },
      { team: "Baking Out", actual: 138.5, projected: 130.3 },
      { team: "Potato Tomato", actual: 127.2, projected: 130.5 },
      { team: "Morning Oatmeal", actual: 121.6, projected: 126.6 },
      { team: "Hey Bob", actual: 118.4, projected: 128.0 },
      { team: "Lando Wins", actual: 111.4, projected: 119.4 },
      { team: "Porteea McLean", actual: 93.3, projected: 103.2 },
      { team: "Pihl Bunyan", actual: 89.2, projected: 119.5 },
    ],
    notes: [
      "Joe Buck Yourself topped the league with 146.2 (+24.5), a 37.6-point jump from Week 2, on Jaxon Smith-Njigba (35.4), Brock Bowers (27.6), Tee Higgins (21.0) and a 19.0-point Vikings D/ST (projected 6.5).",
      "Pihl Bunyan fell to 89.2 (-30.3, the week's biggest bust): De'Von Achane returned 1.7 against a 19.4 projection and Dalton Kincaid 3.8, while Bo Nix's 24.1 sat on the bench behind Patrick Mahomes' 15.9.",
    ],
    standouts: [
      {
        kind: "boom",
        name: "Jahmyr Gibbs",
        position: "RB",
        proTeam: "DET",
        actual: 41.4,
        projected: 25.3,
        note: "Morning Oatmeal · week's top score",
      },
      {
        kind: "boom",
        name: "Bijan Robinson",
        position: "RB",
        proTeam: "ATL",
        actual: 35.3,
        projected: 19.5,
        note: "Baking Out",
      },
      {
        kind: "boom",
        name: "Jaxon Smith-Njigba",
        position: "WR",
        proTeam: "SEA",
        actual: 35.4,
        projected: 20.8,
        note: "Joe Buck Yourself",
      },
      {
        kind: "boom",
        name: "Harold Fannin Jr.",
        position: "TE",
        proTeam: "CLE",
        actual: 24.1,
        projected: 9.8,
        note: "Murph Windango",
      },
      {
        kind: "boom",
        offBench: true,
        name: "Michael Wilson",
        position: "WR",
        proTeam: "ARI",
        actual: 25.9,
        projected: 11.3,
        note: "Benched by Show Me Your TDs",
      },
      {
        kind: "bust",
        name: "De'Von Achane",
        position: "RB",
        proTeam: "MIA",
        actual: 1.7,
        projected: 19.4,
        note: "Pihl Bunyan",
      },
      {
        kind: "bust",
        name: "Justin Jefferson",
        position: "WR",
        proTeam: "MIN",
        actual: 5.2,
        projected: 18.3,
        note: "Show Me Your TDs",
      },
      {
        kind: "bust",
        name: "Jonathan Taylor",
        position: "RB",
        proTeam: "IND",
        actual: 9.2,
        projected: 20.6,
        note: "Hey Bob",
      },
    ],
    freeAgents: [],
    awards: [
      { award: "apex-predator", team: "Joe Buck Yourself", note: "146.1 points, the week's top score" },
      { award: "extinction-event", team: "Murph Windango", note: "Beat Pihl Bunyan by 50.2" },
      { award: "fossilized", team: "Pihl Bunyan", note: "89.2 points, the week's lowest score" },
      { award: "meteor-strike", team: "Show Me Your TDs", note: "140.0 points, 2nd-best of the week, lost to Joe Buck Yourself" },
      { award: "lucky-hooves", team: "Lando Wins", note: "Beat Porteea McLean with 111.4, a bottom-three score" },
      { award: "perfect-lineup", team: "Hey Bob", note: "118.4 points, the most possible from the roster" },
      { award: "perfect-lineup", team: "Murph Windango", note: "139.4 points, the most possible from the roster" },
      { award: "waiver-wizard", team: "Potato Tomato", note: "Brock Purdy scored 31.3" },
      { award: "t-rex-arm", team: "Baking Out", note: "Tyler Shough, 4 pass TDs" },
      { award: "t-rex-arm", team: "Potato Tomato", note: "Brock Purdy, 4 pass TDs" },
      { award: "raptor-speed", team: "Morning Oatmeal", note: "Jahmyr Gibbs scored 41.4" },
    ],
    facts: [
      "The top four teams finished within 7.7 points of each other (146.2 down to 138.5).",
      "Jaxon Smith-Njigba has been Joe Buck Yourself's engine: 42.5 in Week 2 and 35.4 in Week 3.",
      "Show Me Your TDs left Michael Wilson's 25.9 on the bench in a week it finished 2nd, just 6.2 points behind the leader.",
      "Pihl Bunyan fell 32.3 points from Week 2, dropping from 4th to 10th.",
    ],
  },
  {
    week: 4,
    seasonYear: 2026,
    headline: {
      topScoreTeam: "Joe Buck Yourself",
      topScore: 137.2,
      biggestBeatTeam: "Joe Buck Yourself",
      biggestBeat: 15.0,
      biggestBustTeam: "Murph Windango",
      biggestBust: -50.3,
    },
    teams: [
      { team: "Joe Buck Yourself", actual: 137.2, projected: 122.2 },
      { team: "Show Me Your TDs", actual: 132.1, projected: 126.4 },
      { team: "Porteea McLean", actual: 129.4, projected: 116.8 },
      { team: "Morning Oatmeal", actual: 128.3, projected: 126.2 },
      { team: "Potato Tomato", actual: 127.5, projected: 133.3 },
      { team: "Baking Out", actual: 126.3, projected: 130.4 },
      { team: "Hey Bob", actual: 123.3, projected: 132.6 },
      { team: "Lando Wins", actual: 94.0, projected: 104.9 },
      { team: "Pihl Bunyan", actual: 87.3, projected: 101.2 },
      { team: "Murph Windango", actual: 76.6, projected: 126.9 },
    ],
    notes: [
      "Joe Buck Yourself led for the second straight week with 137.2 (+15.0): Tee Higgins (26.7), Brock Bowers (20.6), Jameson Williams (16.2) and kicker Ka'imi Fairbairn (16.0) — with Nico Collins' 30.8 left on the bench. The top seven teams finished within 13.9 points of each other.",
      "Murph Windango scored just 76.6 against a 126.9 projection (-50.3, the biggest miss of the season so far, and a 62.8-point drop from Week 3): Ja'Marr Chase (5.7 vs. 20.4), Davante Adams (7.2) and David Montgomery (4.3) all fell short, while Rhamondre Stevenson (18.4) and DK Metcalf (16.5) sat on the bench.",
    ],
    standouts: [
      {
        kind: "boom",
        name: "CeeDee Lamb",
        position: "WR",
        proTeam: "DAL",
        actual: 41.3,
        projected: 16.9,
        note: "Pihl Bunyan",
      },
      {
        kind: "boom",
        name: "Kyren Williams",
        position: "RB",
        proTeam: "LAR",
        actual: 36.7,
        projected: 13.1,
        note: "Porteea McLean",
      },
      {
        kind: "boom",
        name: "Tee Higgins",
        position: "WR",
        proTeam: "CIN",
        actual: 26.7,
        projected: 13.7,
        note: "Joe Buck Yourself",
      },
      {
        kind: "boom",
        name: "Sam LaPorta",
        position: "TE",
        proTeam: "DET",
        actual: 22.4,
        projected: 11.2,
        note: "Potato Tomato",
      },
      {
        kind: "boom",
        offBench: true,
        name: "Tetairoa McMillan",
        position: "WR",
        proTeam: "CAR",
        actual: 45.2,
        projected: 15.8,
        note: "Benched by Morning Oatmeal · week's top score",
      },
      {
        kind: "bust",
        name: "Rashee Rice",
        position: "WR",
        proTeam: "KC",
        actual: 0.0,
        projected: 14.9,
        note: "Pihl Bunyan",
      },
      {
        kind: "bust",
        name: "Ja'Marr Chase",
        position: "WR",
        proTeam: "CIN",
        actual: 5.7,
        projected: 20.4,
        note: "Murph Windango",
      },
      {
        kind: "bust",
        name: "Parker Washington",
        position: "WR",
        proTeam: "JAX",
        actual: 2.0,
        projected: 15.3,
        note: "Baking Out",
      },
    ],
    freeAgents: [],
    awards: [
      { award: "apex-predator", team: "Joe Buck Yourself", note: "137.2 points, the week's top score" },
      { award: "fossilized", team: "Murph Windango", note: "76.6 points, the week's lowest score" },
      { award: "photo-finish", team: "Baking Out", note: "Lost to Potato Tomato by 1.2" },
      { award: "wrong-fossil", team: "Joe Buck Yourself", note: "Nico Collins scored 30.8 on the bench" },
      { award: "wrong-fossil", team: "Morning Oatmeal", note: "Tetairoa McMillan scored 45.2 on the bench" },
      { award: "wrong-fossil", team: "Potato Tomato", note: "Javonte Williams scored 31.3 on the bench" },
      { award: "lucky-hooves", team: "Lando Wins", note: "Beat Murph Windango with 94.0, a bottom-three score" },
      { award: "escape-artist", team: "Potato Tomato", note: "Beat Baking Out by 1.2" },
      { award: "comeback-kid", team: "Lando Wins", note: "Projected to lose to Murph Windango by 22.2, won by 17.4" },
      { award: "raptor-speed", team: "Pihl Bunyan", note: "CeeDee Lamb scored 41.3" },
    ],
    facts: [
      "Tetairoa McMillan's 45.2 — the week's top individual score — was on Morning Oatmeal's bench, as were Javonte Williams' 31.3 (Potato Tomato) and Nico Collins' 30.8 (Joe Buck Yourself).",
      "Porteea McLean jumped 36.1 points to 129.4 and finished 3rd, powered by Kyren Williams' 36.7 and kicker Jake Bates' 18.0 (projected 8.7).",
      "Morning Oatmeal still leads the league in total points (543.0 through four weeks), 8.8 ahead of Baking Out.",
    ],
  },
  {
    week: 5,
    seasonYear: 2026,
    headline: {
      topScoreTeam: "Baking Out",
      topScore: 170.9,
      biggestBeatTeam: "Baking Out",
      biggestBeat: 47.4,
      biggestBustTeam: "Pihl Bunyan",
      biggestBust: -36.8,
    },
    teams: [
      { team: "Baking Out", actual: 170.9, projected: 123.5 },
      { team: "Potato Tomato", actual: 159.9, projected: 130.4 },
      { team: "Show Me Your TDs", actual: 151.0, projected: 131.6 },
      { team: "Hey Bob", actual: 149.4, projected: 127.5 },
      { team: "Joe Buck Yourself", actual: 130.4, projected: 126.1 },
      { team: "Morning Oatmeal", actual: 113.3, projected: 119.4 },
      { team: "Porteea McLean", actual: 110.7, projected: 90.8 },
      { team: "Murph Windango", actual: 94.2, projected: 117.4 },
      { team: "Lando Wins", actual: 84.1, projected: 115.9 },
      { team: "Pihl Bunyan", actual: 64.0, projected: 100.8 },
    ],
    notes: [
      "Baking Out posted the week's top score, 170.9 (+47.4), on Isaiah Likely (32.4), Christian Watson (32.3), Parker Washington (30.4), George Pickens (28.0) and an 18.0-point Jets D/ST — and moved into first place in total points (705.1, 24.6 ahead of Show Me Your TDs) despite getting -0.2 from Tyler Shough at QB.",
      "Pihl Bunyan scored 64.0 against a 100.8 projection (-36.8), the lowest team score of the season so far: CeeDee Lamb managed 2.9 (projected 19.1), Brian Robinson Jr. 1.6 and Bo Nix 7.9.",
    ],
    standouts: [
      {
        kind: "boom",
        name: "Isaiah Likely",
        position: "TE",
        proTeam: "NYG",
        actual: 32.4,
        projected: 12.9,
        note: "Baking Out",
      },
      {
        kind: "boom",
        name: "Jaylen Warren",
        position: "RB",
        proTeam: "PIT",
        actual: 36.8,
        projected: 17.6,
        note: "Show Me Your TDs",
      },
      {
        kind: "boom",
        name: "Christian Watson",
        position: "WR",
        proTeam: "GB",
        actual: 32.3,
        projected: 13.8,
        note: "Baking Out",
      },
      {
        kind: "boom",
        name: "Puka Nacua",
        position: "WR",
        proTeam: "LAR",
        actual: 37.7,
        projected: 21.7,
        note: "Porteea McLean · tied for the top starter score",
      },
      {
        kind: "boom",
        offBench: true,
        name: "Bucky Irving",
        position: "RB",
        proTeam: "TB",
        actual: 31.5,
        projected: 15.2,
        note: "Benched by Potato Tomato",
      },
      {
        kind: "bust",
        name: "Tyler Shough",
        position: "QB",
        proTeam: "NO",
        actual: -0.2,
        projected: 16.5,
        note: "Baking Out",
      },
      {
        kind: "bust",
        name: "CeeDee Lamb",
        position: "WR",
        proTeam: "DAL",
        actual: 2.9,
        projected: 19.1,
        note: "Pihl Bunyan",
      },
      {
        kind: "bust",
        name: "David Montgomery",
        position: "RB",
        proTeam: "HOU",
        actual: 1.1,
        projected: 11.9,
        note: "Murph Windango",
      },
    ],
    freeAgents: [],
    awards: [
      { award: "apex-predator", team: "Baking Out", note: "170.9 points, the week's top score" },
      { award: "jurassic-park", team: "Baking Out", note: "170.9 points" },
      { award: "jurassic-park", team: "Potato Tomato", note: "159.9 points" },
      { award: "jurassic-park", team: "Show Me Your TDs", note: "151.0 points" },
      { award: "extinction-event", team: "Potato Tomato", note: "Beat Pihl Bunyan by 95.8" },
      { award: "fossilized", team: "Pihl Bunyan", note: "64.0 points, the week's lowest score" },
      { award: "tar-pit", team: "Porteea McLean", note: "5th straight loss" },
      { award: "wrong-fossil", team: "Potato Tomato", note: "Bucky Irving scored 31.5 on the bench" },
      { award: "perfect-lineup", team: "Baking Out", note: "170.9 points, the most possible from the roster" },
      { award: "perfect-lineup", team: "Hey Bob", note: "149.4 points, the most possible from the roster" },
      { award: "perfect-lineup", team: "Porteea McLean", note: "110.7 points, the most possible from the roster" },
      { award: "waiver-wizard", team: "Baking Out", note: "Isaiah Likely scored 32.4; George Pickens scored 28.0" },
      { award: "waiver-wizard", team: "Hey Bob", note: "Jared Goff scored 28.9" },
      { award: "waiver-wizard", team: "Show Me Your TDs", note: "Jaylen Warren scored 36.8" },
      { award: "herd-mentality", team: "Potato Tomato", note: "All 9 starters scored 10+" },
    ],
    facts: [
      "Baking Out topped the league even with Tyler Shough at -0.2 (projected 16.5) at quarterback.",
      "CeeDee Lamb went from 41.3 for Pihl Bunyan in Week 4 to 2.9 in Week 5 — a 38.4-point swing.",
      "Porteea McLean was projected for just 90.8, the lowest projection of any team in any week so far, and still scored 110.7 (+19.9).",
    ],
  },
];

export function getLatestRecap(): WeeklyRecap | null {
  return WEEKLY_RECAPS.length > 0 ? WEEKLY_RECAPS[WEEKLY_RECAPS.length - 1] : null;
}

export function getRecapByWeek(week: number): WeeklyRecap | null {
  return WEEKLY_RECAPS.find((r) => r.week === week) ?? null;
}

// Every award earned so far, flattened across all published weeks, in
// week order -- the Awards page groups and tallies these.
export interface EarnedAward extends RecapAward {
  week: number;
}

export function getAllEarnedAwards(): EarnedAward[] {
  return WEEKLY_RECAPS.flatMap((r) => r.awards.map((a) => ({ ...a, week: r.week })));
}

// One team's awards, one entry per award (in first-earned order) with
// every week it was earned -- repeats collapse into a single badge.
export function getTeamAwards(teamName: string): { award: AwardId; weeks: number[] }[] {
  const byAward = new Map<AwardId, number[]>();
  for (const e of getAllEarnedAwards()) {
    if (e.team !== teamName.trim()) continue;
    byAward.set(e.award, [...(byAward.get(e.award) ?? []), e.week]);
  }
  return [...byAward.entries()].map(([award, weeks]) => ({ award, weeks }));
}
