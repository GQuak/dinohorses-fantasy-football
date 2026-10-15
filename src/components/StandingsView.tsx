"use client";

import { useMemo, useState } from "react";
import CumulativePointsChart, { type ChartSeries } from "./CumulativePointsChart";
import type { CumulativePointsData, League, Team } from "@/lib/types";

type SortKey = "wins" | "losses" | "pointsFor" | "pointsAgainst" | "weekly";
type SortDir = "asc" | "desc";

// Default order: matches ESPN's usual sort (wins, then ties, then
// points-for). Overridden once the user picks a column to sort by.
function sortDefault(rows: Team[]): Team[] {
  return [...rows].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.ties !== a.ties) return b.ties - a.ties;
    return b.pointsFor - a.pointsFor;
  });
}

// Per-week: that week's projected total for the team's starters.
// Full season: average actual score per game played so far (pointsFor
// already only counts starters, same as ESPN's own standings).
function weeklyColumnValue(
  team: Team,
  week: number | "season",
  weeklyTotals: Map<number, number> | null
): number {
  if (week === "season") {
    const gamesPlayed = team.wins + team.losses + team.ties;
    return gamesPlayed > 0 ? Math.round((team.pointsFor / gamesPlayed) * 10) / 10 : 0;
  }
  return weeklyTotals?.get(team.id) ?? 0;
}

function sortValue(
  team: Team,
  key: SortKey,
  week: number | "season",
  weeklyTotals: Map<number, number> | null
): number {
  switch (key) {
    case "wins":
      return team.wins;
    case "losses":
      return team.losses;
    case "pointsFor":
      return team.pointsFor;
    case "pointsAgainst":
      return team.pointsAgainst;
    case "weekly":
      return weeklyColumnValue(team, week, weeklyTotals);
  }
}

function SortableHeader({
  label,
  sortKey,
  activeSort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeSort: { key: SortKey; dir: SortDir } | null;
  onSort: (key: SortKey) => void;
}) {
  const active = activeSort?.key === sortKey;
  return (
    <th className="px-3 py-2 text-right">
      <button
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-0.5 hover:text-neutral-900 dark:hover:text-neutral-100 ${
          active ? "text-neutral-900 dark:text-neutral-100" : ""
        }`}
      >
        {label}
        <span className="w-3 text-[10px]">
          {active ? (activeSort.dir === "desc" ? "▼" : "▲") : ""}
        </span>
      </button>
    </th>
  );
}

function StandingsTable({
  rows,
  week,
  weeklyTotals,
  sort,
  onSort,
}: {
  rows: Team[];
  week: number | "season";
  weeklyTotals: Map<number, number> | null;
  sort: { key: SortKey; dir: SortDir } | null;
  onSort: (key: SortKey) => void;
}) {
  const weeklyLabel = week === "season" ? "Wk Avg" : `Wk ${week} Proj`;

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const factor = sort.dir === "desc" ? -1 : 1;
    return [...rows].sort(
      (a, b) =>
        factor *
        (sortValue(a, sort.key, week, weeklyTotals) - sortValue(b, sort.key, week, weeklyTotals))
    );
  }, [rows, sort, week, weeklyTotals]);

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Team</th>
            <th className="px-3 py-2">Owner</th>
            <SortableHeader label="W" sortKey="wins" activeSort={sort} onSort={onSort} />
            <SortableHeader label="L" sortKey="losses" activeSort={sort} onSort={onSort} />
            <th className="px-3 py-2 text-right">T</th>
            <SortableHeader label="PF" sortKey="pointsFor" activeSort={sort} onSort={onSort} />
            <SortableHeader label="PA" sortKey="pointsAgainst" activeSort={sort} onSort={onSort} />
            <SortableHeader label={weeklyLabel} sortKey="weekly" activeSort={sort} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((team, i) => (
            <tr
              key={team.id}
              className="border-t border-neutral-100 bg-white dark:border-neutral-900 dark:bg-neutral-900"
            >
              <td className="px-3 py-2 text-neutral-500">{i + 1}</td>
              <td className="px-3 py-2 font-medium">{team.name}</td>
              <td className="px-3 py-2 text-neutral-500">{team.ownerNames.join(", ")}</td>
              <td className="px-3 py-2 text-right tabular-nums">{team.wins}</td>
              <td className="px-3 py-2 text-right tabular-nums">{team.losses}</td>
              <td className="px-3 py-2 text-right tabular-nums">{team.ties}</td>
              <td className="px-3 py-2 text-right tabular-nums">{team.pointsFor}</td>
              <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                {team.pointsAgainst}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                {weeklyColumnValue(team, week, weeklyTotals)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function toChartSeries(data: CumulativePointsData): ChartSeries[] {
  return data.series.map((s) => ({
    id: String(s.teamId),
    teamName: s.teamName,
    points: s.points,
    weeklyPoints: s.weeklyPoints,
  }));
}

export default function StandingsView({
  league,
  week,
  weeklyTotals,
  cumulative,
}: {
  league: League;
  week: number | "season";
  weeklyTotals: Map<number, number> | null;
  cumulative: CumulativePointsData;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  function handleSort(key: SortKey) {
    setSort((prev) => {
      if (prev?.key === key) return { key, dir: prev.dir === "desc" ? "asc" : "desc" };
      return { key, dir: "desc" };
    });
  }

  const rows = useMemo(() => sortDefault(league.teams), [league.teams]);

  return (
    <div>
      {sort && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setSort(null)}
            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Reset sort
          </button>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">{league.name}</h2>
        <StandingsTable
          rows={rows}
          week={week}
          weeklyTotals={weeklyTotals}
          sort={sort}
          onSort={handleSort}
        />
        <div className="mt-4">
          <CumulativePointsChart
            title={`${league.name} — Points`}
            weeks={cumulative.weeks}
            series={toChartSeries(cumulative)}
          />
        </div>
      </section>
    </div>
  );
}
