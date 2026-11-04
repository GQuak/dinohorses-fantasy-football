// Midseason facts for the /midseason page. Hand-curated, like the weekly
// recaps: worked out from ESPN data through Week 8 and double-checked
// against ESPN's own standings and box scores.

export type FactCategory = "luck" | "consistency" | "projections" | "lineups" | "waivers" | "players";

export interface SeasonFact {
  title: string;
  emoji: string;
  category: FactCategory;
  team: string;
  stat: string; // the headline number on the card
  statLabel: string;
  detail: string;
}

export const MIDSEASON_THROUGH_WEEK = 8;

export const FACT_CATEGORIES: { id: FactCategory; label: string; emoji: string }[] = [
  { id: "luck", label: "Luck & Records", emoji: "🎲" },
  { id: "consistency", label: "Consistency", emoji: "📊" },
  { id: "projections", label: "Vs. Projections", emoji: "🔮" },
  { id: "lineups", label: "Lineup Decisions", emoji: "🧩" },
  { id: "waivers", label: "Waiver Wire", emoji: "🛒" },
  { id: "players", label: "Players & Blowouts", emoji: "🦖" },
];

export const SEASON_FACTS: SeasonFact[] = [
  {
    title: "Luckiest team",
    emoji: "🍀",
    category: "luck",
    team: "Potato Tomato",
    stat: "7-1",
    statLabel: "record, with about 4.4 wins expected",
    detail:
      "Only 4th in points scored (985.1). Against every team every week they'd be 40-32. They also have the league's fewest points against (806.0) and have won six straight.",
  },
  {
    title: "Unluckiest team",
    emoji: "🌧️",
    category: "luck",
    team: "Show Me Your TDs",
    stat: "4-4",
    statLabel: "despite a league-best 53-19 against everyone",
    detail:
      "2nd in points scored (1,049.6), yet the results have gone L-W-L-W-L-W-L-W.",
  },
  {
    title: "Highest losing score",
    emoji: "💔",
    category: "luck",
    team: "Show Me Your TDs",
    stat: "150.98",
    statLabel: "points in a Week 5 loss",
    detail: "Ran into Baking Out's 170.94.",
  },
  {
    title: "Most consistent team",
    emoji: "📏",
    category: "consistency",
    team: "Lando Wins",
    stat: "12.0",
    statLabel: "standard deviation, the league's lowest",
    detail: "Consistent, but not in a good way: every score falls between 78.4 and 111.4.",
  },
  {
    title: "Most consistent good team",
    emoji: "🎯",
    category: "consistency",
    team: "Hey Bob",
    stat: "16.6",
    statLabel: "standard deviation, 90+ every week",
    detail: "Hasn't scored under 90 all season.",
  },
  {
    title: "Most up-and-down team",
    emoji: "🎢",
    category: "consistency",
    team: "Porteea McLean",
    stat: "25.6",
    statLabel: "standard deviation, the league's highest",
    detail: "Scores from 75.1 to 147.3. Opened 0-6, then won the last two.",
  },
  {
    title: "Biggest underperformer",
    emoji: "📉",
    category: "projections",
    team: "Lando Wins",
    stat: "−107.8",
    statLabel: "points below projections",
    detail:
      "Has beaten its projection only once in eight weeks. Murph Windango is next at 95.0 below.",
  },
  {
    title: "Biggest overperformer",
    emoji: "📈",
    category: "projections",
    team: "Show Me Your TDs",
    stat: "7 of 8",
    statLabel: "weeks beating projections",
    detail: "Joe Buck Yourself is furthest above its projections overall, at +57.8.",
  },
  {
    title: "Best and worst lineup setters",
    emoji: "🧠",
    category: "lineups",
    team: "Hey Bob",
    stat: "92.9%",
    statLabel: "of the best possible lineup",
    detail:
      "The league's best. Pihl Bunyan is last at 85.4% and has left 129.5 points on the bench.",
  },
  {
    title: "Most points on a bench",
    emoji: "🪑",
    category: "lineups",
    team: "Pihl Bunyan",
    stat: "107.2",
    statLabel: "bench points from Bo Nix",
    detail: "In his one start (Week 5), he scored 7.9.",
  },
  {
    title: "Most active manager",
    emoji: "🔁",
    category: "waivers",
    team: "Joe Buck Yourself",
    stat: "24",
    statLabel: "pickups, 8 more than anyone else",
    detail: "Lando Wins has made 3.",
  },
  {
    title: "Best pickup",
    emoji: "💎",
    category: "waivers",
    team: "Show Me Your TDs",
    stat: "120.8",
    statLabel: "points from Jaylen Warren since Week 3",
    detail:
      "He's started every week since joining. Baking Out leads all teams in points started from players it didn't draft (356.4).",
  },
  {
    title: "Top player",
    emoji: "👑",
    category: "players",
    team: "Joe Buck Yourself",
    stat: "220.0",
    statLabel: "points as a starter for Jaxon Smith-Njigba",
    detail: "20+ in 7 of 8 weeks, and 57.5 points above his projections.",
  },
  {
    title: "Biggest draft bust turned pickup",
    emoji: "🔄",
    category: "players",
    team: "Porteea McLean",
    stat: "23.0",
    statLabel: "points from Saquon Barkley in 4 starts",
    detail:
      "Projected for 67.0 in those starts. By Week 6 he was on no roster, and Joe Buck Yourself has since gotten 27.5 from him in two starts.",
  },
  {
    title: "Both kinds of extreme",
    emoji: "⚖️",
    category: "players",
    team: "Pihl Bunyan",
    stat: "0.02",
    statLabel: "margin of the season's closest win",
    detail:
      "Beat Lando Wins 89.30 to 89.28 in Week 7, the season's lowest winning score. Also lost the two biggest blowouts: by 95.84 to Potato Tomato (Week 5) and 91.92 to Joe Buck Yourself (Week 8).",
  },
];
