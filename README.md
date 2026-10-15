# Fantasy Dashboard

A single dashboard combining two private ESPN Fantasy Football leagues:

- **Members & Rosters** — every team, its owner(s), and full roster
- **Standings** — win/loss/points-for/against, per league
- **Player Rankings** — every rostered player across both leagues, ranked by
  season fantasy points, filterable by position (including a **FLEX**
  filter that covers RB/WR/TE together)

Runs with no configuration using bundled sample data. Add your real league
IDs (and cookies, for private leagues) to see live data.

## How it works

ESPN doesn't publish an official Fantasy API. This app talks to the
same read-only endpoint the ESPN Fantasy website itself uses
(`https://fantasy.espn.com/apis/v3/games/ffl/...`). For private leagues,
ESPN requires two cookie values from a logged-in session — `espn_s2` and
`SWID` — sent as request headers. **Those values only ever live on the
server** (as environment variables); the browser/client never sees them.

## Local setup

```bash
npm install
cp .env.example .env.local
```

Leave `.env.local` mostly empty and run `npm run dev` — you'll get the
dashboard populated with sample data, so you can see it working immediately.

To point it at your real leagues, fill in `.env.local`:

### 1. Find your league IDs

Open your league on [fantasy.espn.com](https://fantasy.espn.com), look at
the URL:

```
https://fantasy.espn.com/football/league?leagueId=123456
                                                    ^^^^^^ this
```

Set `LEAGUE_1_ID` and `LEAGUE_2_ID` accordingly, and `SEASON_YEAR` (e.g. `2026`).

### 2. Get your ESPN cookies (private leagues only)

1. In a browser, log in to [fantasy.espn.com](https://fantasy.espn.com) and open your league.
2. Open DevTools → **Application** (Chrome) or **Storage** (Firefox) tab → **Cookies** → `https://fantasy.espn.com`.
3. Copy the values of the `espn_s2` and `SWID` cookies (SWID includes the curly braces, e.g. `{ABCD1234-...}`).
4. Paste them into `.env.local` as `ESPN_S2` and `ESPN_SWID`.

If both leagues are under the same ESPN account, that's all you need. If
League 2 uses a *different* ESPN account, also set `LEAGUE_2_ESPN_S2` /
`LEAGUE_2_SWID` with that account's cookies.

These cookies are long-lived (roughly a year) but will eventually expire —
if the dashboard starts showing an auth error for a league, just repeat
step 2 and update the env var.

### 3. Set a site password

Since this will be hosted publicly, set `SITE_PASSWORD` to whatever you
want, and generate a random `AUTH_SECRET`:

```bash
openssl rand -hex 32
```

Restart `npm run dev` and you should be prompted for the password.

## Deploying to Vercel (free)

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com), sign in, **Add New… → Project**, and import the repo.
3. Before the first deploy (or right after, then redeploy), add all the variables from `.env.example` under **Project Settings → Environment Variables**: `SEASON_YEAR`, `LEAGUE_1_ID`, `LEAGUE_1_NAME`, `LEAGUE_2_ID`, `LEAGUE_2_NAME`, `ESPN_S2`, `ESPN_SWID`, `SITE_PASSWORD`, `AUTH_SECRET` (and the `LEAGUE_2_*` overrides if needed).
4. Deploy. Vercel gives you a `https://<project>.vercel.app` URL — that's your public link, gated by the password page.

Whenever you update a league's cookies or the password, update the env var
in Vercel's dashboard and redeploy (or use "Redeploy" without a new commit).

## Notes / design choices

- **Player Rankings** is scoped to players currently rostered in one of
  your two leagues (not the entire NFL free-agent pool) — that's the set
  relevant to a dashboard comparing your two leagues. Ranking is by each
  player's season-to-date actual fantasy points as scored in their league.
- Position/team-id mappings in [`src/lib/constants.ts`](src/lib/constants.ts)
  are the standard community-documented ESPN mappings. If something ever
  displays as a raw `POS 99` or `SLOT 99` instead of a name, ESPN has an id
  this app doesn't know about yet — easy to add.
- Data is cached for 5 minutes per league (`next: { revalidate: 300 }` in
  [`src/lib/espn.ts`](src/lib/espn.ts)) to avoid hammering ESPN on every
  page load.
