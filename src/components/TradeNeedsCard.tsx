import Link from "next/link";
import type { TeamNeeds } from "@/lib/tradeNeeds";

const FLEX_LABEL = "FLEX (RB/WR/TE)";

function axisLabel(axis: string): string {
  return axis === "FLEX" ? FLEX_LABEL : axis;
}

// A team's trade needs (weak or injury-hit starting spots), surplus (bench
// players who'd start elsewhere) and the teams that fit best, for the
// team page. Uses ESPN's rest-of-season projections.
export default function TradeNeedsCard({
  needs,
  fits,
}: {
  needs: TeamNeeds;
  fits: { teamId: number; teamName: string; theyCover: string[]; youCover: string[] }[];
}) {
  return (
    <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">Trade Needs</h3>
        <Link
          href={`/trade?a=${needs.teamId}`}
          className="text-xs font-medium text-neutral-500 hover:underline"
        >
          Find trade partners &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
            Needs
          </div>
          {needs.needs.length === 0 ? (
            <p className="mt-1 text-sm text-neutral-400">No weak spots in the lineup.</p>
          ) : (
            <ul className="mt-1 space-y-1.5 text-sm">
              {needs.needs.map((n) => (
                <li key={n.axis}>
                  <span className="font-medium">{axisLabel(n.axis)}</span>{" "}
                  <span className="text-neutral-500">
                    #{n.rank} of {n.totalTeams}
                  </span>
                  <div className="text-xs text-neutral-500">
                    {n.starters.map((p) => `${p.name} ${p.projectedPoints.toFixed(1)}`).join(", ")}
                    {n.injured.length > 0 && (
                      <span className="ml-1 text-rose-500">
                        · {n.injured.map((p) => `${p.name} (${p.injuryStatus})`).join(", ")} out
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Surplus
          </div>
          {needs.surplus.length === 0 ? (
            <p className="mt-1 text-sm text-neutral-400">No bench players other teams would start.</p>
          ) : (
            <ul className="mt-1 space-y-1.5 text-sm">
              {needs.surplus.map((s) => (
                <li key={s.player.playerId}>
                  <span className="font-medium">{s.player.name}</span>{" "}
                  <span className="text-xs text-neutral-400">
                    {s.player.position} · {s.player.projectedPoints.toFixed(1)} ROS
                  </span>
                  <div className="text-xs text-neutral-500">
                    Would start for {s.startsFor} of {s.otherTeams} teams
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
            Best fits
          </div>
          {fits.length === 0 ? (
            <p className="mt-1 text-sm text-neutral-400">No obvious matches right now.</p>
          ) : (
            <ul className="mt-1 space-y-1.5 text-sm">
              {fits.slice(0, 3).map((f) => (
                <li key={f.teamId}>
                  <Link
                    href={`/trade?a=${needs.teamId}&b=${f.teamId}`}
                    className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                  >
                    {f.teamName}
                  </Link>
                  <div className="text-xs text-neutral-500">
                    {[
                      f.theyCover.length > 0 &&
                        `has surplus for your ${f.theyCover.map(axisLabel).join(", ")}`,
                      f.youCover.length > 0 &&
                        `needs ${f.youCover.map(axisLabel).join(", ")}, where you have surplus`,
                    ]
                      .filter(Boolean)
                      .join("; ")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {needs.benchedStarters.length > 0 && (
        <p className="mt-3 text-xs text-neutral-500">
          Counted as starters here, though benched in this week&apos;s lineup:{" "}
          {needs.benchedStarters.map((p) => `${p.name} (${p.position})`).join(", ")}. Charts
          based on the current lineup, like Position Strength above, can rank{" "}
          {needs.benchedStarters.length === 1 ? "that position" : "those positions"} lower.
        </p>
      )}

      <p className="mt-3 text-xs text-neutral-400">
        Based on each team&apos;s best possible lineup by ESPN&apos;s rest-of-season projections.
        Players who are out, on IR or suspended only count as starters when there&apos;s no
        healthy backup. A need is a starting spot ranked in the bottom third of the league, or one
        where a ruled-out player would otherwise start. Kickers and defenses aren&apos;t included.
      </p>
    </div>
  );
}
