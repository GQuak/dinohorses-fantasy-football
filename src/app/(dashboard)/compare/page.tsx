import {
  getDashboardData,
  getLeaguePowerScores,
  getStartingLineupRanks,
  getTeamPositionStrength,
  getTeamWeeklyPoints,
} from "@/lib/data";
import DemoBanner, { ErrorBanner } from "@/components/DemoBanner";
import CompareTeamSelector, { type CompareTeamOption } from "@/components/CompareTeamSelector";
import CompareCharts from "@/components/CompareCharts";
import type { League, PowerRankingEntry, Team, WeeklyPoints } from "@/lib/types";

function teamKey(leagueId: string, teamId: number): string {
  return `${leagueId}::${teamId}`;
}

function parseKey(
  key: string | undefined,
  entries: { league: League; team: Team }[]
): { league: League; team: Team } | null {
  if (!key) return null;
  const [leagueId, teamIdStr] = key.split("::");
  const teamId = Number(teamIdStr);
  return entries.find((e) => e.league.leagueId === leagueId && e.team.id === teamId) ?? null;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const sp = await searchParams;
  const { leagues, isDemoData, errors } = await getDashboardData();

  const entries = leagues.flatMap((league) =>
    [...league.teams]
      .sort((x, y) => (x.draftPosition ?? Infinity) - (y.draftPosition ?? Infinity))
      .map((team) => ({ league, team }))
  );

  const options: CompareTeamOption[] = entries.map(({ league, team }) => ({
    key: teamKey(league.leagueId, team.id),
    label: team.name,
  }));

  const entryA = parseKey(sp.a, entries) ?? entries[0] ?? null;
  const entryB =
    parseKey(sp.b, entries) ?? entries.find((e) => e !== entryA) ?? entries[1] ?? null;

  if (!entryA || !entryB) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {isDemoData && <DemoBanner />}
        <ErrorBanner errors={errors} />
        <h2 className="mb-2 text-xl font-semibold">Compare Teams</h2>
        <p className="text-sm text-neutral-500">
          Need at least two teams in the league to compare. Check the error banner above and your
          environment configuration.
        </p>
      </div>
    );
  }

  // One weekly-points fetch for the whole league -- not just the two
  // selected teams', since the Power Rankings table below the charts
  // ranks every team regardless of who's selected.
  const weeklyByLeague = new Map<string, Map<number, WeeklyPoints>>();
  let weeklyError: string | null = null;
  await Promise.all(
    leagues.map(async (league) => {
      const allPlayerIds = league.teams.flatMap((t) => t.roster.map((p) => p.playerId));
      const { points, error } = await getTeamWeeklyPoints(
        league.leagueId,
        allPlayerIds,
        league.currentWeek,
        isDemoData
      );
      weeklyByLeague.set(league.leagueId, points);
      if (error) weeklyError = error;
    })
  );

  function computeFor({ league, team }: { league: League; team: Team }) {
    const weeklyPoints = weeklyByLeague.get(league.leagueId) ?? new Map<number, WeeklyPoints>();
    const { axes: seasonAxes } = getTeamPositionStrength(league, team.id, "season", null);
    const { axes: weekAxes } = getTeamPositionStrength(
      league,
      team.id,
      league.currentWeek,
      weeklyPoints
    );
    const seasonLineup = getStartingLineupRanks(league, team.id, null);
    const weekLineup = getStartingLineupRanks(league, team.id, weeklyPoints);
    return { seasonAxes, weekAxes, seasonLineup, weekLineup };
  }

  const dataA = computeFor(entryA);
  const dataB = computeFor(entryB);

  const currentWeek = entryA.league.currentWeek;

  // Power Rankings: every team, sorted by the same overall score for
  // whichever mode (season/week) the charts above are currently showing
  // -- built once per mode here so the shared toggle can switch the
  // table instantly, same as the charts.
  function rankEveryTeam(mode: "season" | "week"): PowerRankingEntry[] {
    const rows: PowerRankingEntry[] = [];
    for (const league of leagues) {
      const weeklyPoints = weeklyByLeague.get(league.leagueId) ?? null;
      const scores = getLeaguePowerScores(
        league,
        mode === "season" ? "season" : league.currentWeek,
        mode === "season" ? null : weeklyPoints
      );
      for (const team of league.teams) {
        rows.push({
          key: teamKey(league.leagueId, team.id),
          teamName: team.name,
          score: scores.get(team.id) ?? 0,
        });
      }
    }
    return rows.sort((x, y) => y.score - x.score);
  }

  const seasonRankings = rankEveryTeam("season");
  const weekRankings = rankEveryTeam("week");

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {isDemoData && <DemoBanner />}
      <ErrorBanner errors={errors} />
      {weeklyError && <ErrorBanner errors={[{ leagueName: "Weekly stats", message: weeklyError }]} />}

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Compare Teams</h2>
        <p className="text-sm text-neutral-500">
          Pick two teams to overlay their Position Strength and Starting Lineup charts.
        </p>
      </div>

      <CompareTeamSelector
        options={options}
        a={teamKey(entryA.league.leagueId, entryA.team.id)}
        b={teamKey(entryB.league.leagueId, entryB.team.id)}
      />

      <CompareCharts
        labelA={entryA.team.name}
        labelB={entryB.team.name}
        keyA={teamKey(entryA.league.leagueId, entryA.team.id)}
        keyB={teamKey(entryB.league.leagueId, entryB.team.id)}
        seasonAxesA={dataA.seasonAxes}
        weekAxesA={dataA.weekAxes}
        seasonAxesB={dataB.seasonAxes}
        weekAxesB={dataB.weekAxes}
        seasonLineupA={dataA.seasonLineup}
        weekLineupA={dataA.weekLineup}
        seasonLineupB={dataB.seasonLineup}
        weekLineupB={dataB.weekLineup}
        seasonRankings={seasonRankings}
        weekRankings={weekRankings}
        currentWeek={currentWeek}
      />
    </div>
  );
}
