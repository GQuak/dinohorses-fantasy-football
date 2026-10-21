import { getPlayerPool } from "@/lib/data";
import { freeAgentCandidates, getTeamFreeAgentFits } from "@/lib/freeAgents";
import type { TeamNeeds } from "@/lib/tradeNeeds";
import type { League } from "@/lib/types";

const axisLabel = (axis: string) => (axis === "FLEX" ? "FLEX" : axis);

// The free agents that would most improve this team's best lineup. An
// async server component: the player-pool fetch is large and uncached,
// so the team page wraps this in Suspense and streams it in after the
// rest of the page.
export default async function TeamFreeAgents({
  leagues,
  league,
  teamId,
  needs,
  isDemoData,
}: {
  leagues: League[];
  league: League;
  teamId: number;
  needs: TeamNeeds | undefined;
  isDemoData: boolean;
}) {
  const { players, error } = await getPlayerPool(leagues, isDemoData);
  const fits = getTeamFreeAgentFits(league, teamId, freeAgentCandidates(players), needs);

  return (
    <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="font-semibold">Top Free Agents</h3>
      <p className="mb-3 text-sm text-neutral-500">
        Pickups that would most improve this team&apos;s best lineup.
      </p>

      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">
          Free agents couldn&apos;t be loaded right now.
        </p>
      ) : fits.length === 0 ? (
        <p className="text-sm text-neutral-400">No free agent would improve this lineup right now.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {fits.map((f) => (
            <li
              key={f.player.playerId}
              className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <span className="font-medium">{f.player.name}</span>{" "}
                <span className="text-xs text-neutral-400">
                  {f.player.position} · {f.player.proTeam}
                  {f.player.injuryStatus && (
                    <span className="ml-1 text-rose-500">{f.player.injuryStatus}</span>
                  )}{" "}
                  · {f.player.projectedPoints.toFixed(1)} ROS
                </span>
                {f.fillsNeeds.length > 0 && (
                  <span className="ml-2 rounded-full border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:text-emerald-400">
                    Fills {f.fillsNeeds.map(axisLabel).join(", ")} need
                  </span>
                )}
                {f.drop && (
                  <div className="text-xs text-neutral-500">
                    Drop {f.drop.name} ({f.drop.position}) to make room
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                +{f.gainPerWeek.toFixed(1)} pts/wk
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-neutral-400">
        Gain is the change in this team&apos;s best possible lineup by ESPN&apos;s rest-of-season
        projections, per week left. Free agents who are out, on IR or suspended aren&apos;t shown.
      </p>
    </div>
  );
}

export function TeamFreeAgentsLoading() {
  return (
    <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="font-semibold">Top Free Agents</h3>
      <p className="mt-1 text-sm text-neutral-400">Loading free agents…</p>
    </div>
  );
}
