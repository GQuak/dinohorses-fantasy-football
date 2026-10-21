"use client";

import { useMemo, useState } from "react";
import type { LeagueFreeAgentFit } from "@/lib/freeAgents";
import type { RankedPlayer } from "@/lib/types";

const POSITION_FILTERS = ["ALL", "QB", "RB", "WR", "TE", "FLEX", "K", "D/ST"] as const;
type PositionFilter = (typeof POSITION_FILTERS)[number];

const STATUS_FILTERS = ["ALL", "ROSTERED", "FREE_AGENT"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL: "All",
  ROSTERED: "Rostered",
  FREE_AGENT: "Free Agent",
};

function matchesPosition(player: RankedPlayer, filter: PositionFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "FLEX") return player.isFlexEligible;
  return player.position === filter;
}

function matchesStatus(player: RankedPlayer, filter: StatusFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "ROSTERED") return player.isRostered;
  return !player.isRostered;
}

function FilterGroup<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            value === opt
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
              : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
          }`}
        >
          {labels ? labels[opt] : opt}
        </button>
      ))}
    </div>
  );
}

// Shown above the table when the Free Agent filter is on: the free agents
// who'd improve the most teams' best lineups.
function TopFreeAgents({ fits }: { fits: LeagueFreeAgentFit[] }) {
  return (
    <div className="mb-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className="font-semibold">Top Free Agents</h3>
      <p className="mb-3 text-sm text-neutral-500">
        The free agents who&apos;d improve the most teams&apos; best lineups.
      </p>
      {fits.length === 0 ? (
        <p className="text-sm text-neutral-400">No free agent would improve any lineup right now.</p>
      ) : (
        <ol className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {fits.map((f, i) => (
            <li
              key={f.player.playerId}
              className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <span className="mr-2 text-xs text-neutral-400">{i + 1}</span>
                <span className="font-medium">{f.player.name}</span>{" "}
                <span className="text-xs text-neutral-400">
                  {f.player.position} · {f.player.proTeam}
                  {f.player.injuryStatus && (
                    <span className="ml-1 text-rose-500">{f.player.injuryStatus}</span>
                  )}{" "}
                  · {f.player.projectedPoints.toFixed(1)} ROS
                </span>
              </div>
              <div className="flex-shrink-0 text-xs text-neutral-500 sm:text-right">
                <div>
                  Would improve{" "}
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {f.teamsHelped} of {f.totalTeams}
                  </span>{" "}
                  lineups
                </div>
                {f.bestTeam && (
                  <div>
                    Most for {f.bestTeam.teamName}{" "}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      +{f.bestTeam.gainPerWeek.toFixed(1)} pts/wk
                    </span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-xs text-neutral-400">
        Based on each team&apos;s best possible lineup by ESPN&apos;s rest-of-season projections,
        after dropping whoever that lineup misses least. Free agents who are out, on IR or
        suspended aren&apos;t included.
      </p>
    </div>
  );
}

export default function RankingsView({
  players,
  topFreeAgents,
}: {
  players: RankedPlayer[];
  topFreeAgents: LeagueFreeAgentFit[];
}) {
  const [position, setPosition] = useState<PositionFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players
      .filter((p) => matchesPosition(p, position))
      .filter((p) => matchesStatus(p, status))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints;
        if (b.projectedPoints !== a.projectedPoints) return b.projectedPoints - a.projectedPoints;
        return b.percentOwned - a.percentOwned;
      });
  }, [players, position, status, query]);

  const columnCount = 9;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <FilterGroup options={POSITION_FILTERS} value={position} onChange={setPosition} />
        <input
          type="text"
          placeholder="Search player…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="ml-auto w-full max-w-[220px] rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900"
        />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <FilterGroup
          options={STATUS_FILTERS}
          value={status}
          onChange={setStatus}
          labels={STATUS_LABELS}
        />
      </div>
      {status === "FREE_AGENT" && <TopFreeAgents fits={topFreeAgents} />}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[840px] text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2">Pos</th>
              <th className="px-3 py-2">Pro Team</th>
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2 text-right">% Own</th>
              <th className="px-3 py-2 text-right">Proj</th>
              <th className="px-3 py-2 text-right">Avg/Gm</th>
              <th className="px-3 py-2 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.playerId}
                className="border-t border-neutral-100 bg-white dark:border-neutral-900 dark:bg-neutral-900"
              >
                <td className="px-3 py-2 text-neutral-500">{i + 1}</td>
                <td className="px-3 py-2 font-medium">
                  {p.name}
                  {p.injuryStatus && (
                    <span className="ml-1.5 rounded bg-red-100 px-1 text-[10px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                      {p.injuryStatus}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-neutral-500">{p.position}</td>
                <td className="px-3 py-2 text-neutral-500">{p.proTeam}</td>
                <td className="px-3 py-2 text-neutral-500">
                  {p.rosterSpot ? (
                    <>
                      {p.rosterSpot.teamName}
                      <span className="block text-xs text-neutral-400">
                        {p.rosterSpot.ownerNames.join(", ")}
                      </span>
                    </>
                  ) : (
                    <span className="text-neutral-400">Free Agent</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                  {p.percentOwned ? `${p.percentOwned}%` : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                  {p.projectedPoints}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                  {p.avgPoints || "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{p.seasonPoints}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-3 py-6 text-center text-neutral-500">
                  {players.length === 0
                    ? "No player data available yet."
                    : "No players match this filter/search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
