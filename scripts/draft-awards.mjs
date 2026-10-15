// Drafts one week's awards (see src/lib/awards.ts) from ESPN data, and
// prints them as an `awards: [...]` block ready to paste into that week's
// entry in src/lib/recapData.ts. A starting point for the hand-curated
// list, not the final word -- review it, tweak the notes, then paste.
//
//   npm run awards -- 6
//
// Uses the same .env.local league ID + cookies as the app. Fetches every
// week from 1 through the target week, since records, streaks, standings
// and waiver pickups all depend on earlier weeks.
//
// Season-long awards (Schedule Merchant, Trade Baron, etc.) aren't
// drafted here -- they're decided by hand for the final week.

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
process.loadEnvFile(path.join(root, ".env.local"));
const { SEASON_YEAR, LEAGUE_1_ID, ESPN_S2, ESPN_SWID } = process.env;

const targetWeek = Number(process.argv[2]);
if (!Number.isInteger(targetWeek) || targetWeek < 1) {
  console.error("Usage: npm run awards -- <week>");
  process.exit(1);
}
if (!LEAGUE_1_ID || !SEASON_YEAR) {
  console.error("LEAGUE_1_ID and SEASON_YEAR must be set in .env.local.");
  process.exit(1);
}

const BASE = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON_YEAR}/segments/0/leagues/${LEAGUE_1_ID}`;

async function espn(query, filter) {
  const headers = { Accept: "application/json" };
  if (ESPN_S2 && ESPN_SWID) headers.Cookie = `espn_s2=${ESPN_S2}; SWID=${ESPN_SWID}`;
  if (filter) headers["X-Fantasy-Filter"] = JSON.stringify(filter);
  const res = await fetch(BASE + query, { headers });
  if (!res.ok) throw new Error(`ESPN returned ${res.status} for ${query}`);
  return res.json();
}

const POSITION = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "D/ST" };
const STARTER_SLOTS = new Set([0, 2, 4, 6, 16, 17, 23]); // QB RB WR TE D/ST K FLEX
const BENCH_SLOT = 20;
const IR_SLOT = 21;
// Best-possible lineup shape, for Perfect Lineup; FLEX is filled after.
const LINEUP_SHAPE = [["QB", 1], ["RB", 2], ["WR", 2], ["TE", 1], ["K", 1], ["D/ST", 1]];
const FLEX_POSITIONS = new Set(["RB", "WR", "TE"]);

// Same order as AWARDS in src/lib/awards.ts, so the output reads the same
// way the recap page lists them.
const AWARD_ORDER = fs
  .readFileSync(path.join(root, "src/lib/awards.ts"), "utf8")
  .match(/\| "[a-z-]+"/g)
  .map((m) => m.slice(3, -1));

const r1 = (n) => (Math.round(n * 10 + 1e-9) / 10).toFixed(1);
const sum = (list) => list.reduce((t, e) => t + e.actual, 0);

const league = await espn("?view=mTeam");
const teamName = new Map(league.teams.map((t) => [t.id, t.name.trim()]));

if (targetWeek >= (league.status?.currentMatchupPeriod ?? Infinity)) {
  console.error(
    `Warning: ESPN still lists week ${league.status.currentMatchupPeriod} as current, ` +
      `so week ${targetWeek}'s scores may not be final yet.`
  );
}

const results = new Map([...teamName.keys()].map((id) => [id, []])); // "W" | "L" | "T" per week
const pointsFor = new Map([...teamName.keys()].map((id) => [id, 0]));
const pickups = new Set(); // `${teamId}:${playerId}` added via waivers or free agency

// Standings going into a week: wins, then points-for.
function standings() {
  return [...teamName.keys()].sort((a, b) => {
    const wins = (id) => results.get(id).filter((r) => r === "W").length;
    return wins(b) - wins(a) || pointsFor.get(b) - pointsFor.get(a);
  });
}

function bestPossibleScore(players) {
  const pool = players.filter((p) => p.slot !== IR_SLOT);
  const used = new Set();
  let total = 0;
  for (const [pos, count] of LINEUP_SHAPE) {
    const best = pool.filter((p) => p.position === pos).sort((a, b) => b.actual - a.actual);
    for (const p of best.slice(0, count)) {
      total += p.actual;
      used.add(p.id);
    }
  }
  const flex = pool
    .filter((p) => FLEX_POSITIONS.has(p.position) && !used.has(p.id))
    .sort((a, b) => b.actual - a.actual)[0];
  return total + (flex?.actual ?? 0);
}

// Streak awards fire the week the streak reaches 5, not every week after.
function streakJustHit(list, result) {
  const n = list.length;
  return n >= 5 && list.slice(-5).every((r) => r === result) && (n === 5 || list[n - 6] !== result);
}

let drafted = [];

for (let week = 1; week <= targetWeek; week++) {
  const tx = await espn(`?view=mTransactions2&scoringPeriodId=${week}`);
  for (const t of tx.transactions ?? []) {
    if (t.status !== "EXECUTED" || (t.type !== "WAIVER" && t.type !== "FREEAGENT")) continue;
    for (const item of t.items ?? []) {
      if (item.type === "ADD") pickups.add(`${item.toTeamId}:${item.playerId}`);
    }
  }

  const box = await espn(`?view=mBoxscore&view=mMatchupScore&scoringPeriodId=${week}`, {
    schedule: { filterMatchupPeriodIds: { value: [week] } },
  });

  const teams = new Map();
  for (const m of box.schedule ?? []) {
    if (m.matchupPeriodId !== week || !m.home || !m.away) continue;
    for (const [side, opp] of [[m.home, m.away], [m.away, m.home]]) {
      const players = (side.rosterForCurrentScoringPeriod?.entries ?? []).map((e) => {
        const p = e.playerPoolEntry.player;
        const stat = (source) =>
          p.stats?.find((s) => s.scoringPeriodId === week && s.statSourceId === source);
        return {
          id: p.id,
          name: p.fullName,
          position: POSITION[p.defaultPositionId],
          slot: e.lineupSlotId,
          actual: stat(0)?.appliedTotal ?? 0,
          projected: stat(1)?.appliedTotal ?? 0,
          passTds: stat(0)?.stats?.["4"] ?? 0,
        };
      });
      const starters = players.filter((p) => STARTER_SLOTS.has(p.slot));
      teams.set(side.teamId, {
        score: side.totalPoints,
        opponent: opp.teamId,
        players,
        starters,
        bench: players.filter((p) => p.slot === BENCH_SLOT),
        projected: starters.reduce((t, p) => t + p.projected, 0),
      });
    }
  }
  if (teams.size === 0) {
    console.error(`No matchups found for week ${week}.`);
    process.exit(1);
  }

  const order = week > 1 ? standings() : null;
  const byScore = [...teams.keys()].sort((a, b) => teams.get(b).score - teams.get(a).score);
  const awards = [];
  const add = (award, teamId, note) => awards.push({ award, team: teamName.get(teamId), note });

  add("apex-predator", byScore[0], `${r1(teams.get(byScore[0]).score)} points, the week's top score`);
  add("fossilized", byScore.at(-1), `${r1(teams.get(byScore.at(-1)).score)} points, the week's lowest score`);

  for (const [id, t] of teams) {
    const opp = teams.get(t.opponent);
    const oppName = teamName.get(t.opponent);
    const margin = t.score - opp.score;
    const won = margin > 0;
    results.get(id).push(won ? "W" : margin < 0 ? "L" : "T");
    pointsFor.set(id, pointsFor.get(id) + t.score);

    if (t.score >= 150) add("jurassic-park", id, `${r1(t.score)} points`);
    if (margin >= 50) add("extinction-event", id, `Beat ${oppName} by ${r1(margin)}`);
    if (streakJustHit(results.get(id), "W")) add("stampede", id, "5th straight win");
    if (streakJustHit(results.get(id), "L")) add("tar-pit", id, "5th straight loss");
    if (id === byScore[1] && !won)
      add("meteor-strike", id, `${r1(t.score)} points, 2nd-best of the week, lost to ${oppName}`);
    if (margin < 0 && margin > -2) add("photo-finish", id, `Lost to ${oppName} by ${r1(-margin)}`);

    const starterTotal = sum(t.starters);
    const benchTotal = sum(t.bench);
    if (benchTotal > starterTotal)
      add("bench-regret", id, `Bench ${r1(benchTotal)} vs. starters ${r1(starterTotal)}`);
    const benchBooms = t.bench.filter((p) => p.actual >= 30);
    if (benchBooms.length)
      add("wrong-fossil", id, benchBooms.map((p) => `${p.name} scored ${r1(p.actual)} on the bench`).join("; "));

    if (won && byScore.slice(-3).includes(id))
      add("lucky-hooves", id, `Beat ${oppName} with ${r1(t.score)}, a bottom-three score`);
    if (won && margin < 2) add("escape-artist", id, `Beat ${oppName} by ${r1(margin)}`);
    if (won && opp.projected - t.projected >= 15)
      add("comeback-kid", id, `Projected to lose to ${oppName} by ${r1(opp.projected - t.projected)}, won by ${r1(margin)}`);
    if (won && order && order.indexOf(id) >= order.length / 2 && order[0] === t.opponent)
      add("giant-slayer", id, `Beat 1st-place ${oppName} from #${order.indexOf(id) + 1}`);

    if (Math.abs(bestPossibleScore(t.players) - starterTotal) < 0.05)
      add("perfect-lineup", id, `${r1(starterTotal)} points, the most possible from the roster`);
    const wizards = t.starters.filter((p) => p.actual >= 25 && pickups.has(`${id}:${p.id}`));
    if (wizards.length)
      add("waiver-wizard", id, wizards.map((p) => `${p.name} scored ${r1(p.actual)}`).join("; "));

    // Player feats: one award per team per week, however many players qualify.
    const arms = t.starters.filter((p) => p.position === "QB" && p.passTds >= 4);
    if (arms.length) add("t-rex-arm", id, arms.map((p) => `${p.name}, ${p.passTds} pass TDs`).join("; "));
    const raptors = t.starters.filter((p) => p.actual >= 40);
    if (raptors.length) add("raptor-speed", id, raptors.map((p) => `${p.name} scored ${r1(p.actual)}`).join("; "));
    if (t.starters.length && t.starters.every((p) => p.actual >= 10))
      add("herd-mentality", id, `All ${t.starters.length} starters scored 10+`);
    const top = Math.max(...t.starters.map((p) => p.actual));
    const carriers = t.starters.filter((p) => (p.position === "K" || p.position === "D/ST") && p.actual >= top);
    if (carriers.length)
      add("kicker-carry", id, carriers.map((p) => `${p.name} (${p.position}) led the team with ${r1(p.actual)}`).join("; "));
  }

  drafted = awards;
}

drafted.sort(
  (a, b) => AWARD_ORDER.indexOf(a.award) - AWARD_ORDER.indexOf(b.award) || a.team.localeCompare(b.team)
);

console.log(`// Week ${targetWeek} -- drafted from ESPN data; review before pasting.`);
console.log("    awards: [");
for (const a of drafted) {
  console.log(`      { award: "${a.award}", team: ${JSON.stringify(a.team)}, note: ${JSON.stringify(a.note)} },`);
}
console.log("    ],");
