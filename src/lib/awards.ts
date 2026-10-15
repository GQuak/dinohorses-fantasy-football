// The season's award catalog. Which teams actually earned what is
// hand-curated alongside each week's recap (WeeklyRecap.awards in
// recapData.ts) -- this file only defines what each award is.
//
// Curation rules:
// - Weekly awards can be earned any number of times across the season;
//   the Awards page tallies repeats ("×3").
// - At most one entry per team, per award, per week -- e.g. two players
//   scoring 40+ for the same team in the same week is still a single
//   Raptor Speed.
// - Streak awards (Stampede, Tar Pit) go in the week the streak reaches
//   its length, not every week it continues.
// - Season awards are handed out once, in the final week's recap.

export type AwardCategory =
  | "dominance"
  | "heartbreak"
  | "luck"
  | "management"
  | "player"
  | "season";

export type AwardId =
  | "apex-predator"
  | "jurassic-park"
  | "extinction-event"
  | "stampede"
  | "fossilized"
  | "tar-pit"
  | "meteor-strike"
  | "photo-finish"
  | "bench-regret"
  | "wrong-fossil"
  | "lucky-hooves"
  | "escape-artist"
  | "comeback-kid"
  | "giant-slayer"
  | "schedule-merchant"
  | "perfect-lineup"
  | "waiver-wizard"
  | "trade-baron"
  | "set-it-and-forget-it"
  | "tinkerer"
  | "t-rex-arm"
  | "raptor-speed"
  | "herd-mentality"
  | "kicker-carry"
  | "evolution"
  | "iron-dino";

export interface AwardDef {
  id: AwardId;
  name: string;
  emoji: string;
  category: AwardCategory;
  description: string;
}

export const AWARD_CATEGORIES: { id: AwardCategory; label: string; emoji: string }[] = [
  { id: "dominance", label: "Dominance", emoji: "🏆" },
  { id: "heartbreak", label: "Heartbreak & Misfortune", emoji: "😬" },
  { id: "luck", label: "Luck & Drama", emoji: "🍀" },
  { id: "management", label: "Management Skill", emoji: "🧠" },
  { id: "player", label: "Individual Player Feats", emoji: "⭐" },
  { id: "season", label: "Season-Long", emoji: "📈" },
];

export const AWARDS: AwardDef[] = [
  // Dominance
  { id: "apex-predator", name: "Apex Predator", emoji: "🦖", category: "dominance", description: "Highest score in the league for the week." },
  { id: "jurassic-park", name: "Jurassic Park", emoji: "🌋", category: "dominance", description: "Score 150+ points in a single week." },
  { id: "extinction-event", name: "Extinction Event", emoji: "☄️", category: "dominance", description: "Beat your opponent by 50+ points." },
  { id: "stampede", name: "Stampede", emoji: "🐎", category: "dominance", description: "Win 5 games in a row." },

  // Heartbreak & Misfortune
  { id: "fossilized", name: "Fossilized", emoji: "🦴", category: "heartbreak", description: "Lowest score in the league for the week." },
  { id: "tar-pit", name: "Tar Pit", emoji: "🕳️", category: "heartbreak", description: "Lose 5 games in a row." },
  { id: "meteor-strike", name: "Meteor Strike", emoji: "💥", category: "heartbreak", description: "Post the week's second-highest score and still lose." },
  { id: "photo-finish", name: "Photo Finish", emoji: "📸", category: "heartbreak", description: "Lose by less than 2 points." },
  { id: "bench-regret", name: "Bench Regret", emoji: "🪑", category: "heartbreak", description: "Your bench outscores your starters." },
  { id: "wrong-fossil", name: "Wrong Fossil", emoji: "🔍", category: "heartbreak", description: "A player on your bench scores 30+ points." },

  // Luck & Drama
  { id: "lucky-hooves", name: "Lucky Hooves", emoji: "🍀", category: "luck", description: "Win while posting one of the week's three lowest scores." },
  { id: "escape-artist", name: "Escape Artist", emoji: "🪤", category: "luck", description: "Win by less than 2 points." },
  { id: "comeback-kid", name: "Comeback Kid", emoji: "🔄", category: "luck", description: "Win after being projected to lose by 15+ points." },
  { id: "giant-slayer", name: "Giant Slayer", emoji: "🗡️", category: "luck", description: "Beat the 1st-place team while sitting in the bottom half." },

  // Management Skill
  { id: "perfect-lineup", name: "Perfect Lineup", emoji: "🎯", category: "management", description: "Start the best possible lineup for the week." },
  { id: "waiver-wizard", name: "Waiver Wizard", emoji: "🪄", category: "management", description: "A waiver pickup scores 25+ points in your starting lineup." },

  // Individual Player Feats
  { id: "t-rex-arm", name: "T-Rex Arm", emoji: "💪", category: "player", description: "Your QB throws 4+ TDs in a game." },
  { id: "raptor-speed", name: "Raptor Speed", emoji: "⚡", category: "player", description: "One of your players scores 40+ points." },
  { id: "herd-mentality", name: "Herd Mentality", emoji: "🐾", category: "player", description: "Every starter scores 10+ points." },
  { id: "kicker-carry", name: "Kicker Carry", emoji: "🦵", category: "player", description: "Your kicker or D/ST is your top scorer." },

  // Season-Long (awarded in the final week's recap)
  { id: "schedule-merchant", name: "Schedule Merchant", emoji: "📅", category: "season", description: "Finish with a better record than your point differential suggests." },
  { id: "trade-baron", name: "Trade Baron", emoji: "🤝", category: "season", description: "Players you got in a trade outscore the players you gave up, over the rest of the season." },
  { id: "set-it-and-forget-it", name: "Set It & Forget It", emoji: "😴", category: "season", description: "Make zero roster moves all season." },
  { id: "tinkerer", name: "Tinkerer", emoji: "🔧", category: "season", description: "Make the most transactions in the league." },
  { id: "evolution", name: "Evolution", emoji: "🧬", category: "season", description: "Improve your weekly average by 20+ points from the first half to the second half." },
  { id: "iron-dino", name: "Iron Dino", emoji: "🛡️", category: "season", description: "Lead the league in points-for at season end." },
];

const AWARDS_BY_ID = new Map(AWARDS.map((a) => [a.id, a]));

export function getAward(id: AwardId): AwardDef {
  return AWARDS_BY_ID.get(id)!;
}
