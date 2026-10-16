import Link from "next/link";
import type { SuggestedTrade } from "@/lib/tradeNeeds";
import type { ProjectionSource } from "@/lib/projections";
import type { RosterPlayer } from "@/lib/types";

const axisLabel = (axis: string) => (axis === "FLEX" ? "FLEX" : axis);

function names(players: RosterPlayer[]): string {
  return players.map((p) => `${p.name} (${p.position})`).join(" + ");
}

function tradeHref(teamId: number, s: SuggestedTrade, source: ProjectionSource): string {
  const params = new URLSearchParams({
    a: String(teamId),
    b: String(s.partnerId),
    ga: s.gives.map((p) => p.playerId).join(","),
    gb: s.gets.map((p) => p.playerId).join(","),
  });
  if (source !== "espn") params.set("src", source);
  return `/trade?${params.toString()}`;
}

// The Trade page's empty state: for Team A, the best trade with each other
// team that improves both teams' best lineups, with a link that loads it
// into the analyzer.
export default function TradePartners({
  teamId,
  teamName,
  suggestions,
  source,
  sourceLabel,
}: {
  teamId: number;
  teamName: string;
  suggestions: SuggestedTrade[];
  source: ProjectionSource;
  sourceLabel: string;
}) {
  return (
    <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="font-semibold">Trade partners for {teamName}</h3>
      <p className="mb-3 text-sm text-neutral-500">
        The most balanced trade with each team that improves both best lineups, by{" "}
        {sourceLabel} rest-of-season projections. Or pick players above to build your own.
      </p>

      {suggestions.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No 1-for-1 or 2-for-1 trade improves both {teamName} and another team right now.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {suggestions.map((s) => (
            <li
              key={s.partnerId}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 text-sm">
                <div className="font-semibold">{s.partnerName}</div>
                <div>
                  <span className="text-neutral-500">You give</span> {names(s.gives)}
                </div>
                <div>
                  <span className="text-neutral-500">You get</span> {names(s.gets)}
                </div>
                {(s.coversNeeds.length > 0 || s.partnerCoversNeeds.length > 0) && (
                  <div className="mt-0.5 text-xs text-neutral-400">
                    {[
                      s.coversNeeds.length > 0 &&
                        `Their surplus fits your ${s.coversNeeds.map(axisLabel).join(", ")} need`,
                      s.partnerCoversNeeds.length > 0 &&
                        `yours fits their ${s.partnerCoversNeeds.map(axisLabel).join(", ")} need`,
                    ]
                      .filter(Boolean)
                      .join("; ")}
                  </div>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <div className="text-right text-xs tabular-nums">
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                    You +{s.gainPerWeek.toFixed(1)} pts/wk
                  </div>
                  <div className="text-neutral-500">They +{s.partnerGainPerWeek.toFixed(1)} pts/wk</div>
                </div>
                <Link
                  href={tradeHref(teamId, s, source)}
                  className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Try this trade
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-neutral-400">
        Gains are estimates before free-agent pickups; the analyzer shows exact numbers. Kickers and
        defenses aren&apos;t included.
      </p>
    </div>
  );
}
