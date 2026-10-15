import Link from "next/link";
import { getDashboardData } from "@/lib/data";
import DemoBanner, { ErrorBanner } from "@/components/DemoBanner";
import type { Team } from "@/lib/types";

function TeamCard({ leagueId, team }: { leagueId: string; team: Team }) {
  return (
    <Link
      href={`/teams/${leagueId}/${team.id}`}
      className="block rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600"
    >
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h3 className="font-semibold">{team.name}</h3>
          <p className="text-xs text-neutral-500">
            {team.ownerNames.length > 0 ? team.ownerNames.join(", ") : "Unknown owner"}
          </p>
          {team.draftPosition && (
            <p className="mt-1 text-xs text-neutral-400">Draft: #{team.draftPosition}</p>
          )}
        </div>
        <p className="whitespace-nowrap text-sm text-neutral-500">
          {team.wins}-{team.losses}
          {team.ties ? `-${team.ties}` : ""}
        </p>
      </div>
      <p className="mt-3 text-sm font-medium text-neutral-400 dark:text-neutral-500">
        View roster →
      </p>
    </Link>
  );
}

export default async function TeamsPage() {
  const { leagues, isDemoData, errors } = await getDashboardData();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {isDemoData && <DemoBanner />}
      <ErrorBanner errors={errors} />
      <div className="flex flex-col gap-10">
        {leagues.map((league) => (
          <section key={league.leagueId}>
            <h2 className="mb-3 text-lg font-semibold">
              {league.name}{" "}
              <span className="text-sm font-normal text-neutral-500">
                · {league.teams.length} teams
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...league.teams]
                .sort((a, b) => (a.draftPosition ?? Infinity) - (b.draftPosition ?? Infinity))
                .map((team) => (
                  <TeamCard key={team.id} leagueId={league.leagueId} team={team} />
                ))}
            </div>
          </section>
        ))}
        {leagues.length === 0 && (
          <p className="text-sm text-neutral-500">
            No league data available. Check the error banner above and your .env.local
            configuration.
          </p>
        )}
      </div>
    </div>
  );
}
