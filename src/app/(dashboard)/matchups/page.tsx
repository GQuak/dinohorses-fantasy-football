import { getDashboardData, getWeekMatchups } from "@/lib/data";
import DemoBanner, { ErrorBanner } from "@/components/DemoBanner";
import MatchupsView from "@/components/MatchupsView";
import WeekSelector from "@/components/WeekSelector";

export default async function MatchupsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const sp = await searchParams;
  const { leagues, isDemoData, errors } = await getDashboardData();
  const league = leagues[0] ?? null;

  if (!league) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {isDemoData && <DemoBanner />}
        <ErrorBanner errors={errors} />
        <h2 className="mb-2 text-xl font-semibold">Matchups</h2>
        <p className="text-sm text-neutral-500">
          No league data available. Check the error banner above and your environment configuration.
        </p>
      </div>
    );
  }

  const requested = Number(sp.week);
  const week =
    sp.week && Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), 1), league.totalWeeks)
      : league.currentWeek;
  const { matchups, error } = await getWeekMatchups(league, week, isDemoData);
  const pageErrors = error ? [...errors, { leagueName: "Matchups", message: error }] : errors;

  const gamesLeft = matchups.some((m) =>
    [...m.home.starters, ...m.away.starters].some(
      (p) => p.gameState === "upcoming" || p.gameState === "live"
    )
  );

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {isDemoData && <DemoBanner />}
      <ErrorBanner errors={pageErrors} />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Week {week} Matchups</h2>
          <p className="text-sm text-neutral-500">
            Actual points once a player&apos;s game kicks off, projected points until then.
            {week === league.currentWeek && gamesLeft && " Updates every minute while games are on."}
          </p>
        </div>
        <WeekSelector week={week} totalWeeks={league.totalWeeks} />
      </div>

      {matchups.length > 0 ? (
        <MatchupsView matchups={matchups} autoRefresh={week === league.currentWeek && gamesLeft} />
      ) : (
        !error && (
          <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
            {isDemoData
              ? "Matchups need a real ESPN league connected."
              : `No matchups scheduled for week ${week}.`}
          </p>
        )
      )}

      <p className="mt-4 pb-2 text-xs text-neutral-400">
        Projections are ESPN&apos;s pre-game numbers for the week; projected totals add each
        team&apos;s points so far to what&apos;s still projected. Win probability is ESPN&apos;s.
        Records are current, not as of the week shown.
      </p>
    </div>
  );
}
