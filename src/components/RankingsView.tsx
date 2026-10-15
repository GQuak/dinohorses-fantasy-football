"use client";

import { useMemo, useState } from "react";
import type { RankedPlayer } from "@/lib/types";

const POSITION_FILTERS = ["ALL", "QB", "RB", "WR", "TE", "FLEX", "K", "D/ST"] as const;
type PositionFilter = (typeof POSITION_FILTERS)[number];

const STATUS_FILTERS = ["ALL", "ROSTERED", "FREE_AGENT"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL: "All",
  ROSTERED: "Rostered",
  FREE_AGENT: "Free Agent (Either League)",
};

const ALL_LEAGUES = "ALL";

interface LeagueInfo {
  leagueId: string;
  name: string;
}

// "Adswerve League - EAST" -> "EAST". Falls back to the full name for
// anything that doesn't follow that "<prefix> - <short>" convention
// (e.g. demo-mode league names).
function shortLeagueLabel(name: string): string {
  const parts = name.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function matchesPosition(player: RankedPlayer, filter: PositionFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "FLEX") return player.isFlexEligible;
  return player.position === filter;
}

// "Rostered" = on a roster in at least one of your leagues. "Free Agent"
// = unrostered in at least one of your leagues -- these overlap for a
// player split across leagues (rostered in one, open in the other), which
// is intentional: that player is real waiver-wire info for whichever
// league they're open in, even though someone else already has them
// elsewhere.
function matchesStatus(player: RankedPlayer, filter: StatusFilter, totalLeagues: number): boolean {
  if (filter === "ALL") return true;
  if (filter === "ROSTERED") return player.isRostered;
  return player.rosters.length < Math.max(totalLeagues, 1);
}

function matchesLeague(player: RankedPlayer, leagueId: string): boolean {
  if (leagueId === ALL_LEAGUES) return true;
  return player.rosters.some((r) => r.leagueId === leagueId);
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

export default function RankingsView({
  players,
  leagues,
}: {
  players: RankedPlayer[];
  leagues: LeagueInfo[];
}) {
  const [position, setPosition] = useState<PositionFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [league, setLeague] = useState<string>(ALL_LEAGUES);
  const [query, setQuery] = useState("");

  const leagueFilterOptions = useMemo(
    () => [ALL_LEAGUES, ...leagues.map((l) => l.leagueId)],
    [leagues]
  );
  const leagueFilterLabels = useMemo(() => {
    const labels: Record<string, string> = { [ALL_LEAGUES]: "All Leagues" };
    for (const l of leagues) labels[l.leagueId] = shortLeagueLabel(l.name);
    return labels;
  }, [leagues]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players
      .filter((p) => matchesPosition(p, position))
      .filter((p) => matchesStatus(p, status, leagues.length))
      .filter((p) => matchesLeague(p, league))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints;
        if (b.projectedPoints !== a.projectedPoints) return b.projectedPoints - a.projectedPoints;
        return b.percentOwned - a.percentOwned;
      });
  }, [players, position, status, league, query, leagues]);

  const columnCount = 4 + leagues.length + 4;

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
        {leagues.length > 0 && (
          <FilterGroup
            options={leagueFilterOptions}
            value={league}
            onChange={setLeague}
            labels={leagueFilterLabels}
          />
        )}
      </div>
      {status === "FREE_AGENT" && (
        <p className="mb-3 text-xs text-neutral-500">
          Includes players open in at least one of your leagues, even if another team already
          has them in the other.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[840px] text-sm">
          <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2">Pos</th>
              <th className="px-3 py-2">Pro Team</th>
              {leagues.map((l) => (
                <th className="px-3 py-2" key={l.leagueId}>
                  {shortLeagueLabel(l.name)}
                </th>
              ))}
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
                {leagues.map((l) => {
                  const spot = p.rosters.find((r) => r.leagueId === l.leagueId);
                  return (
                    <td className="px-3 py-2 text-neutral-500" key={l.leagueId}>
                      {spot ? (
                        <>
                          {spot.teamName}
                          <span className="block text-xs text-neutral-400">
                            {spot.ownerNames.join(", ")}
                          </span>
                        </>
                      ) : (
                        <span className="text-neutral-400">Free Agent</span>
                      )}
                    </td>
                  );
                })}
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
