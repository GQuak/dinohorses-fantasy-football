import { getDashboardData, getPlayerPool } from "@/lib/data";
import DemoBanner, { ErrorBanner } from "@/components/DemoBanner";
import RankingsView from "@/components/RankingsView";
import { getGroupedLeagueFreeAgentFits } from "@/lib/freeAgents";

export default async function RankingsPage() {
  const { leagues, isDemoData, errors } = await getDashboardData();
  const { players, error: poolError } = await getPlayerPool(leagues, isDemoData);

  const league = leagues[0] ?? null;
  const freeAgentGroups = league ? getGroupedLeagueFreeAgentFits(league, players) : [];

  const allErrors = poolError
    ? [...errors, { leagueName: "Player pool", message: poolError }]
    : errors;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {isDemoData && <DemoBanner />}
      <ErrorBanner errors={allErrors} />
      <h2 className="mb-3 text-lg font-semibold">Player Rankings</h2>
      <p className="mb-4 text-sm text-neutral-500">
        Every rostered player in the league, plus the wider NFL free-agent pool. Use FLEX to
        see RB/WR/TE together.
      </p>
      <RankingsView players={players} freeAgentGroups={freeAgentGroups} />
    </div>
  );
}
