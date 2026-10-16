"use client";

import { usePathname, useRouter } from "next/navigation";
import { COMPARE_COLORS, type CompareTeamColor } from "@/lib/compareColors";
import { starterSlotSortIndex } from "@/lib/constants";
import type { ProjectionSource } from "@/lib/projections";
import type { RosterPlayer } from "@/lib/types";

export interface TradeBuilderTeam {
  id: number;
  name: string;
  roster: RosterPlayer[];
}

// The whole trade lives in the URL (?a=&b=&ga=&gb=), so a proposed trade
// can be shared as a link. Every change is a real navigation and the
// server recomputes the analysis.
function useTradeUrl(
  state: { a: number; b: number; ga: number[]; gb: number[] },
  src: ProjectionSource
) {
  const router = useRouter();
  const pathname = usePathname();
  return (next: Partial<typeof state>) => {
    const merged = { ...state, ...next };
    const params = new URLSearchParams();
    params.set("a", String(merged.a));
    params.set("b", String(merged.b));
    if (merged.ga.length) params.set("ga", merged.ga.join(","));
    if (merged.gb.length) params.set("gb", merged.gb.join(","));
    if (src !== "espn") params.set("src", src);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
}

function sortForPicker(roster: RosterPlayer[]): RosterPlayer[] {
  const group = (p: RosterPlayer) => (p.lineupSlot === "Bench" ? 1 : p.lineupSlot === "IR" ? 2 : 0);
  return [...roster].sort(
    (x, y) =>
      group(x) - group(y) ||
      starterSlotSortIndex(x.lineupSlot) - starterSlotSortIndex(y.lineupSlot) ||
      y.projectedPoints - x.projectedPoints
  );
}

function TeamColumn({
  label,
  color,
  teams,
  team,
  otherTeamId,
  selected,
  onTeamChange,
  onToggle,
}: {
  label: string;
  color: CompareTeamColor;
  teams: TradeBuilderTeam[];
  team: TradeBuilderTeam;
  otherTeamId: number;
  selected: number[];
  onTeamChange: (id: number) => void;
  onToggle: (playerId: number) => void;
}) {
  return (
    <div className="flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <label className="flex flex-col gap-1 p-3 text-sm">
        <span className={`flex items-center gap-1.5 font-medium ${color.text}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} /> {label} sends
        </span>
        <select
          value={team.id}
          onChange={(e) => onTeamChange(Number(e.target.value))}
          className="rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id} disabled={t.id === otherTeamId}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex justify-between border-t border-neutral-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
        <span>Player</span>
        <span>ROS proj</span>
      </div>
      <ul className="max-h-96 overflow-y-auto">
        {sortForPicker(team.roster).map((p) => {
          const checked = selected.includes(p.playerId);
          return (
            <li key={p.playerId} className="border-t border-neutral-100 dark:border-neutral-800">
              <label
                className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm ${
                  checked ? "bg-amber-50 dark:bg-amber-950/40" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                }`}
              >
                <input type="checkbox" checked={checked} onChange={() => onToggle(p.playerId)} />
                <span className="w-10 flex-shrink-0 text-xs text-neutral-400">{p.lineupSlot}</span>
                <span className="min-w-0 flex-1 truncate">
                  {p.name}{" "}
                  <span className="text-xs text-neutral-400">
                    {p.position} · {p.proTeam}
                    {p.injuryStatus && <span className="ml-1 text-rose-500">{p.injuryStatus}</span>}
                  </span>
                </span>
                <span className="tabular-nums text-neutral-500">{p.projectedPoints.toFixed(1)}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function TradeBuilder({
  teams,
  a,
  b,
  ga,
  gb,
  src,
}: {
  teams: TradeBuilderTeam[];
  a: number;
  b: number;
  ga: number[];
  gb: number[];
  src: ProjectionSource;
}) {
  const go = useTradeUrl({ a, b, ga, gb }, src);
  const teamA = teams.find((t) => t.id === a)!;
  const teamB = teams.find((t) => t.id === b)!;
  const toggle = (list: number[], id: number) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <div className="mb-6">
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => go({ ga: [], gb: [] })}
          disabled={ga.length === 0 && gb.length === 0}
          className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          ↺ Start over
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <TeamColumn
          label="Team A"
          color={COMPARE_COLORS.a}
          teams={teams}
          team={teamA}
          otherTeamId={b}
          selected={ga}
          // Switching teams clears that side's picks -- they belong to the old roster.
          onTeamChange={(id) => go({ a: id, ga: [] })}
          onToggle={(id) => go({ ga: toggle(ga, id) })}
        />
        <TeamColumn
          label="Team B"
          color={COMPARE_COLORS.b}
          teams={teams}
          team={teamB}
          otherTeamId={a}
          selected={gb}
          onTeamChange={(id) => go({ b: id, gb: [] })}
          onToggle={(id) => go({ gb: toggle(gb, id) })}
        />
      </div>
    </div>
  );
}
