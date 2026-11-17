"use client";

import { useMemo, useState } from "react";
import CumulativePointsChart, { type ChartSeries } from "./CumulativePointsChart";
import type { CumulativePointsData, League, Team, TeamExpectations } from "@/lib/types";

type SortKey =
  | "wins"
  | "losses"
  | "pointsFor"
  | "pointsAgainst"
  | "weekly"
  | "leagueRecord"
  | "expectedWins"
  | "luck"
  | "vsProjected";
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

// Win share of a team's league record (every team vs. every other team,
// every week).
function leagueWinPct(e: TeamExpectations): number {
  const games = e.leagueWins + e.leagueLosses + e.leagueTies;
  return games ? (e.leagueWins + e.leagueTies / 2) / games : 0;
}

function sortValue(
  team: Team,
  key: SortKey,
  week: number | "season",
  weeklyTotals: Map<number, number> | null,
  expectations: Map<number, TeamExpectations>
): number {
  const e = expectations.get(team.id);
  switch (key) {
    case "leagueRecord":
      return e ? leagueWinPct(e) : 0;
    case "expectedWins":
      return e?.expectedWins ?? 0;
    case "luck":
      return e?.luck ?? 0;
    case "vsProjected":
      return e?.vsProjected ?? 0;
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
  title,
  sortKey,
  activeSort,
  onSort,
}: {
  label: string;
  title?: string;
  sortKey: SortKey;
  activeSort: { key: SortKey; dir: SortDir } | null;
  onSort: (key: SortKey) => void;
}) {
  const active = activeSort?.key === sortKey;
  return (
    <th className="whitespace-nowrap px-3 py-2 text-right">
      <button
        title={title}
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
  expectations,
  sort,
  onSort,
}: {
  rows: Team[];
  week: number | "season";
  weeklyTotals: Map<number, number> | null;
  expectations: Map<number, TeamExpectations>;
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
        (sortValue(a, sort.key, week, weeklyTotals, expectations) -
          sortValue(b, sort.key, week, weeklyTotals, expectations))
    );
  }, [rows, sort, week, weeklyTotals, expectations]);

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[860px] text-sm">
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
            <SortableHeader
              label="Lg Rec"
              title="League record: every team vs. every other team, every week"
              sortKey="leagueRecord"
              activeSort={sort}
              onSort={onSort}
            />
            <SortableHeader
              label="Exp W"
              title="Expected wins: the league record scaled to one game a week"
              sortKey="expectedWins"
              activeSort={sort}
              onSort={onSort}
            />
            <SortableHeader
              label="Luck"
              title="Actual wins minus expected wins"
              sortKey="luck"
              activeSort={sort}
              onSort={onSort}
            />
            <SortableHeader
              label="vs Proj"
              title="Points scored minus the starters' projections, all weeks"
              sortKey="vsProjected"
              activeSort={sort}
              onSort={onSort}
            />
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
              <ExpectationCells e={expectations.get(team.id)} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}`;
const signedClass = (n: number) =>
  n > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : n < 0
      ? "text-rose-600 dark:text-rose-400"
      : "text-neutral-500";

function ExpectationCells({ e }: { e: TeamExpectations | undefined }) {
  if (!e || e.weeks === 0) {
    return (
      <>
        {[0, 1, 2, 3].map((i) => (
          <td key={i} className="px-3 py-2 text-right text-neutral-400">
            —
          </td>
        ))}
      </>
    );
  }
  return (
    <>
      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
        {e.leagueWins}-{e.leagueLosses}
        {e.leagueTies ? `-${e.leagueTies}` : ""}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
        {e.expectedWins.toFixed(1)}
      </td>
      <td className={`px-3 py-2 text-right font-medium tabular-nums ${signedClass(e.luck)}`}>
        {signed(e.luck)}
      </td>
      <td
        className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${signedClass(e.vsProjected)}`}
        title={`Beat projections in ${e.beatProjectedWeeks} of ${e.weeks} weeks`}
      >
        {signed(e.vsProjected)}
        <span className="ml-1 text-[11px] text-neutral-400">
          {e.beatProjectedWeeks}/{e.weeks}
        </span>
      </td>
    </>
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
  expectations,
  cumulative,
}: {
  league: League;
  week: number | "season";
  weeklyTotals: Map<number, number> | null;
  expectations: Map<number, TeamExpectations>;
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
          expectations={expectations}
          sort={sort}
          onSort={handleSort}
        />
        <p className="mt-2 text-xs text-neutral-500">
          <span className="font-medium">Lg Rec</span> plays every team against every other team
          each week, so it ignores who you happened to face. <span className="font-medium">Exp W</span>{" "}
          is that record scaled to one game a week, and <span className="font-medium">Luck</span> is
          actual wins minus expected wins. <span className="font-medium">vs Proj</span> is points
          scored minus what the starting lineups were projected to score, with the weeks beating
          projections alongside. All four cover completed weeks only.
        </p>
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
