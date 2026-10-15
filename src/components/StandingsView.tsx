"use client";

import { useMemo, useState } from "react";
import CumulativePointsChart, { type ChartSeries } from "./CumulativePointsChart";
import { leagueShortName } from "@/lib/constants";
import type { CumulativePointsData, CumulativePointsSeries, League, Team } from "@/lib/types";

type Mode = "perLeague" | "combined";
type SortKey = "wins" | "losses" | "pointsFor" | "pointsAgainst" | "weekly";
type SortDir = "asc" | "desc";

interface StandingRow extends Team {
  leagueId: string;
  leagueName: string;
}

// Plain "teamId" ids are only unique within one league -- the per-league
// charts can use them as-is (one league per chart), but need converting
// to CumulativePointsChart's string id either way.
function toChartSeries(series: CumulativePointsSeries[]): ChartSeries[] {
  return series.map((s) => ({
    id: String(s.teamId),
    teamName: s.teamName,
    points: s.points,
    weeklyPoints: s.weeklyPoints,
  }));
}

// Hues (in HSL) assigned to each league in the combined/merged chart, in
// league order -- blue for the first league, green for the second. A
// third or fourth league (not currently the case here) would fall back to
// red/amber rather than erroring.
const LEAGUE_HUES = [217, 142, 0, 38];

// `count` shades of one hue, darkest/boldest (most saturated-looking)
// first -- assigned to teams in season-total rank order, so within a
// league's color family, a richer shade reads as "ranked higher."
function shadesForHue(hue: number, count: number): string[] {
  if (count <= 1) return [`hsl(${hue}, 80%, 50%)`];
  const lightnessMax = 68;
  const lightnessMin = 36;
  return Array.from({ length: count }, (_, i) => {
    const lightness = lightnessMax - (i * (lightnessMax - lightnessMin)) / (count - 1);
    return `hsl(${hue}, 80%, ${Math.round(lightness)}%)`;
  });
}

// Combined-view default order: most wins first, points-for breaks ties,
// then fewer points-against breaks any remaining tie. (Overridden once
// the user picks a column to sort by.)
function sortCombined(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    return a.pointsAgainst - b.pointsAgainst;
  });
}

// Per-league default order: matches each league's usual sort (wins, then
// ties, then points-for).
function sortPerLeague(rows: StandingRow[]): StandingRow[] {
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
  team: StandingRow,
  week: number | "season",
  weeklyTotals: Map<string, number> | null
): number {
  if (week === "season") {
    const gamesPlayed = team.wins + team.losses + team.ties;
    return gamesPlayed > 0 ? Math.round((team.pointsFor / gamesPlayed) * 10) / 10 : 0;
  }
  return weeklyTotals?.get(`${team.leagueId}:${team.id}`) ?? 0;
}

function sortValue(
  team: StandingRow,
  key: SortKey,
  week: number | "season",
  weeklyTotals: Map<string, number> | null
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
  showLeagueColumn,
  week,
  weeklyTotals,
  sort,
  onSort,
}: {
  rows: StandingRow[];
  showLeagueColumn: boolean;
  week: number | "season";
  weeklyTotals: Map<string, number> | null;
  sort: { key: SortKey; dir: SortDir } | null;
  onSort: (key: SortKey) => void;
}) {
  const weeklyLabel = week === "season" ? "Wk Avg" : `Wk ${week} Proj`;

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const factor = sort.dir === "desc" ? -1 : 1;
    return [...rows].sort(
      (a, b) => factor * (sortValue(a, sort.key, week, weeklyTotals) - sortValue(b, sort.key, week, weeklyTotals))
    );
  }, [rows, sort, week, weeklyTotals]);

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Team</th>
            {showLeagueColumn && <th className="px-3 py-2">League</th>}
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
              key={`${team.leagueName}-${team.id}`}
              className="border-t border-neutral-100 bg-white dark:border-neutral-900 dark:bg-neutral-900"
            >
              <td className="px-3 py-2 text-neutral-500">{i + 1}</td>
              <td className="px-3 py-2 font-medium">{team.name}</td>
              {showLeagueColumn && (
                <td className="px-3 py-2 text-neutral-500">{team.leagueName}</td>
              )}
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

export default function StandingsView({
  leagues,
  week,
  weeklyTotals,
  cumulative,
}: {
  leagues: League[];
  week: number | "season";
  weeklyTotals: Map<string, number> | null;
  cumulative: { leagueId: string; leagueName: string; data: CumulativePointsData }[];
}) {
  const [mode, setMode] = useState<Mode>("perLeague");
  // Shared across every table on the page (both per-league tables, and
  // the combined one) so picking a sort sticks when switching views.
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  function handleSort(key: SortKey) {
    setSort((prev) => {
      if (prev?.key === key) return { key, dir: prev.dir === "desc" ? "asc" : "desc" };
      return { key, dir: "desc" };
    });
  }

  const rowsByLeague = useMemo(
    () =>
      leagues.map((league) => ({
        league,
        rows: sortPerLeague(
          league.teams.map((t) => ({ ...t, leagueId: league.leagueId, leagueName: league.name }))
        ),
      })),
    [leagues]
  );

  const combinedRows = useMemo(
    () =>
      sortCombined(
        leagues.flatMap((league) =>
          league.teams.map((t) => ({ ...t, leagueId: league.leagueId, leagueName: league.name }))
        )
      ),
    [leagues]
  );

  // The combined chart merges every team from every league onto one chart
  // (24 lines, for two 12-team leagues) rather than showing each league's
  // chart side by side -- so each league gets its own color family (blue,
  // red, ...) instead of all 24 teams sharing one 12-color palette, which
  // would otherwise put two unrelated teams on the exact same color.
  const combinedChart = useMemo(() => {
    const withWeeks = cumulative.filter((c) => c.data.weeks.length > 0);
    if (withWeeks.length === 0) {
      return { weeks: [] as number[], series: [] as ChartSeries[], colorFor: () => "#3b82f6" };
    }

    const weekCount = Math.min(...withWeeks.map((c) => c.data.weeks.length));
    const weeks = Array.from({ length: weekCount }, (_, i) => i + 1);

    const colorById = new Map<string, string>();
    const series: ChartSeries[] = [];

    withWeeks.forEach((c, leagueIdx) => {
      const hue = LEAGUE_HUES[leagueIdx % LEAGUE_HUES.length];
      const shortName = leagueShortName(c.leagueName);
      // Rank within the league (by season-to-date total) -- the rank, not
      // raw roster order, is what the shade gradient follows.
      const ranked = [...c.data.series].sort(
        (a, b) => (b.points[b.points.length - 1] ?? 0) - (a.points[a.points.length - 1] ?? 0)
      );
      const shades = shadesForHue(hue, ranked.length);
      ranked.forEach((s, i) => {
        const id = `${c.leagueId}:${s.teamId}`;
        colorById.set(id, shades[i]);
        series.push({
          id,
          teamName: `${s.teamName} (${shortName})`,
          points: s.points.slice(0, weekCount),
          weeklyPoints: s.weeklyPoints.slice(0, weekCount),
        });
      });
    });

    return { weeks, series, colorFor: (id: string) => colorById.get(id) ?? "#737373" };
  }, [cumulative]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {(
            [
              { key: "perLeague", label: "Per League" },
              { key: "combined", label: "Combined" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setMode(opt.key)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === opt.key
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {sort && (
          <button
            onClick={() => setSort(null)}
            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Reset sort
          </button>
        )}
      </div>

      {mode === "combined" ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">All Leagues</h2>
          <p className="mb-3 text-sm text-neutral-500">
            {sort
              ? "Click a column heading again to reverse it, or Reset sort to go back to default."
              : "Sorted by wins, then points for, then points against. Click a column heading to sort."}
          </p>
          <StandingsTable
            rows={combinedRows}
            showLeagueColumn
            week={week}
            weeklyTotals={weeklyTotals}
            sort={sort}
            onSort={handleSort}
          />
          {/* Combined mode has no per-league grouping for the table itself,
              so this merges every team from both leagues onto one 24-line
              chart instead of showing two separate per-league ones. */}
          <div className="mt-6">
            <CumulativePointsChart
              title="All Leagues — Points"
              weeks={combinedChart.weeks}
              series={combinedChart.series}
              colorFor={combinedChart.colorFor}
            />
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-8">
          {rowsByLeague.map(({ league, rows }) => {
            const chart = cumulative.find((c) => c.leagueId === league.leagueId);
            return (
              <section key={league.leagueId}>
                <h2 className="mb-3 text-lg font-semibold">{league.name}</h2>
                <StandingsTable
                  rows={rows}
                  showLeagueColumn={false}
                  week={week}
                  weeklyTotals={weeklyTotals}
                  sort={sort}
                  onSort={handleSort}
                />
                {chart && (
                  <div className="mt-4">
                    <CumulativePointsChart
                      title={`${league.name} — Points`}
                      weeks={chart.data.weeks}
                      series={toChartSeries(chart.data.series)}
                    />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
