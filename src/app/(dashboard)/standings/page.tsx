import { getCumulativePoints, getDashboardData, getTeamWeeklyPoints } from "@/lib/data";
import DemoBanner, { ErrorBanner } from "@/components/DemoBanner";
import StandingsView from "@/components/StandingsView";
import WeekSelector from "@/components/WeekSelector";

export default async function StandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const { leagues, isDemoData, errors } = await getDashboardData();

  const totalWeeks = leagues[0]?.totalWeeks ?? 17;
  const requested = Number(sp.week);
  const week: number | "season" =
    sp.week && sp.week !== "season" && Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), 1), totalWeeks)
      : "season";

  // Weekly total = sum of a team's STARTERS' projected points for that
  // week (bench/IR don't count toward a team's score). One fetch per
  // league covers every team in it, rather than one call per team.
  let weeklyTotals: Map<string, number> | null = null;
  const weeklyErrors: { leagueName: string; message: string }[] = [];

  if (week !== "season") {
    weeklyTotals = new Map();
    for (const league of leagues) {
      const starterIds = league.teams.flatMap((t) =>
        t.roster
          .filter((p) => p.lineupSlot !== "Bench" && p.lineupSlot !== "IR")
          .map((p) => p.playerId)
      );
      const { points, error } = await getTeamWeeklyPoints(
        league.leagueId,
        starterIds,
        week,
        isDemoData
      );
      if (error) weeklyErrors.push({ leagueName: league.name, message: error });

      for (const team of league.teams) {
        const total = team.roster
          .filter((p) => p.lineupSlot !== "Bench" && p.lineupSlot !== "IR")
          .reduce((sum, p) => sum + (points.get(p.playerId)?.projected ?? 0), 0);
        weeklyTotals.set(`${league.leagueId}:${team.id}`, Math.round(total * 10) / 10);
      }
    }
  }

  const cumulativeResults = await Promise.all(
    leagues.map(async (league) => {
      const { data, error } = await getCumulativePoints(league, isDemoData);
      return { league, data, error };
    })
  );
  const cumulativeErrors = cumulativeResults
    .filter((c) => c.error)
    .map((c) => ({ leagueName: c.league.name, message: c.error as string }));
  const cumulative = cumulativeResults.map((c) => ({
    leagueId: c.league.leagueId,
    leagueName: c.league.name,
    data: c.data,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {isDemoData && <DemoBanner />}
      <ErrorBanner errors={[...errors, ...weeklyErrors, ...cumulativeErrors]} />
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Standings</h2>
        <WeekSelector week={week} totalWeeks={totalWeeks} includeSeasonOption />
      </div>
      <StandingsView
        leagues={leagues}
        week={week}
        weeklyTotals={weeklyTotals}
        cumulative={cumulative}
      />
    </div>
  );
}
