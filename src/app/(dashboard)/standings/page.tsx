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
  const league = leagues[0] ?? null;

  if (!league) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {isDemoData && <DemoBanner />}
        <ErrorBanner errors={errors} />
        <h2 className="mb-2 text-lg font-semibold">Standings</h2>
        <p className="text-sm text-neutral-500">
          No league data available. Check the error banner above and your environment
          configuration.
        </p>
      </div>
    );
  }

  const totalWeeks = league.totalWeeks;
  const requested = Number(sp.week);
  const week: number | "season" =
    sp.week && sp.week !== "season" && Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), 1), totalWeeks)
      : "season";

  // Weekly total = sum of a team's STARTERS' projected points for that
  // week (bench/IR don't count toward a team's score). One fetch covers
  // every team in the league, rather than one call per team.
  let weeklyTotals: Map<number, number> | null = null;
  const pageErrors = [...errors];

  if (week !== "season") {
    weeklyTotals = new Map();
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
    if (error) pageErrors.push({ leagueName: league.name, message: error });

    for (const team of league.teams) {
      const total = team.roster
        .filter((p) => p.lineupSlot !== "Bench" && p.lineupSlot !== "IR")
        .reduce((sum, p) => sum + (points.get(p.playerId)?.projected ?? 0), 0);
      weeklyTotals.set(team.id, Math.round(total * 10) / 10);
    }
  }

  const { data: cumulative, error: cumulativeError } = await getCumulativePoints(
    league,
    isDemoData
  );
  if (cumulativeError) pageErrors.push({ leagueName: league.name, message: cumulativeError });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {isDemoData && <DemoBanner />}
      <ErrorBanner errors={pageErrors} />
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Standings</h2>
        <WeekSelector week={week} totalWeeks={totalWeeks} includeSeasonOption />
      </div>
      <StandingsView
        league={league}
        week={week}
        weeklyTotals={weeklyTotals}
        cumulative={cumulative}
      />
    </div>
  );
}
