import { COMPARE_COLORS } from "@/lib/compareColors";
import type { PowerRankingEntry } from "@/lib/types";

// Full team-by-team leaderboard below the two charts: every team in the
// league, sorted by the same overall Power Score, with the two
// selected teams (A/B) picked out in their chart colors so it's easy to
// see where they land among everyone else, not just against each other.
export default function PowerRankings({
  rankings,
  keyA,
  keyB,
  mode,
  currentWeek,
}: {
  rankings: PowerRankingEntry[];
  keyA: string;
  keyB: string;
  mode: "season" | "week";
  currentWeek: number;
}) {
  const periodLabel = mode === "season" ? "season" : `week ${currentWeek}`;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="mb-1 font-semibold">Power Rankings</h3>
      <p className="mb-3 text-xs text-neutral-500">
        Every team&apos;s {periodLabel} Power Score: the weighted average of its Position Strength
        rank (as a percentile of the league) across QB / RB / WR / TE / FLEX / D-ST / K -- RB
        and WR count double every other position. 100 = #1 at every position, 0 = last at every
        position.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="py-1.5 pr-2">Rank</th>
              <th className="py-1.5 pr-2">Team</th>
              <th className="py-1.5 pr-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((row, i) => {
              const isA = row.key === keyA;
              const isB = row.key === keyB;
              const rowClasses = isA
                ? `${COMPARE_COLORS.a.text} bg-blue-50 dark:bg-blue-950/40`
                : isB
                  ? `${COMPARE_COLORS.b.text} bg-violet-50 dark:bg-violet-950/40`
                  : "text-neutral-700 dark:text-neutral-300";
              return (
                <tr
                  key={row.key}
                  className={`border-t border-neutral-100 dark:border-neutral-800 ${rowClasses}`}
                >
                  <td className="py-1.5 pr-2 font-semibold tabular-nums">{i + 1}</td>
                  <td className="py-1.5 pr-2">
                    <span className="flex items-center gap-1.5">
                      {isA && <span className={`h-2 w-2 flex-shrink-0 rounded-full ${COMPARE_COLORS.a.dot}`} />}
                      {isB && <span className={`h-2 w-2 flex-shrink-0 rounded-full ${COMPARE_COLORS.b.dot}`} />}
                      <span className="truncate">{row.teamName}</span>
                    </span>
                  </td>
                  <td className="py-1.5 pr-2 text-right font-semibold tabular-nums">
                    {row.score.toFixed(1)}
                  </td>
                </tr>
              );
            })}
            {rankings.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-neutral-500">
                  No teams to rank yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
