import { getDashboardData, getPlayerPool } from "@/lib/data";
import DemoBanner, { ErrorBanner } from "@/components/DemoBanner";
import RankingsView from "@/components/RankingsView";

export default async function RankingsPage() {
  const { leagues, isDemoData, errors } = await getDashboardData();
  const { players, error: poolError } = await getPlayerPool(leagues, isDemoData);

  const allErrors = poolError
    ? [...errors, { leagueName: "Player pool", message: poolError }]
    : errors;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {isDemoData && <DemoBanner />}
      <ErrorBanner errors={allErrors} />
      <h2 className="mb-3 text-lg font-semibold">Player Rankings</h2>
      <p className="mb-4 text-sm text-neutral-500">
        Every rostered player across both leagues, plus the wider NFL free-agent pool.
        Use FLEX to see RB/WR/TE together.
      </p>
      <RankingsView
        players={players}
        leagues={leagues.map((l) => ({ leagueId: l.leagueId, name: l.name }))}
      />
    </div>
  );
}
