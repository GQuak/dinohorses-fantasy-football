"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Matchup, MatchupPlayer, MatchupSide } from "@/lib/types";

// How often to re-fetch while games are in progress. ESPN's data is
// cached for a minute on the server, so refreshing faster wouldn't help.
const REFRESH_MS = 60_000;

// Kickoff in the viewer's own time zone. The server renders in UTC, so
// the first paint can differ from the browser's -- suppressHydrationWarning
// lets the browser's local version win without a hydration error.
function Kickoff({ ts }: { ts: number }) {
  const text = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(ts);
  return <span suppressHydrationWarning>{text}</span>;
}

function PlayerCell({ p, align }: { p?: MatchupPlayer; align: "left" | "right" }) {
  if (!p) return <div />;
  const right = align === "right";
  const status =
    p.gameState === "bye"
      ? "Bye"
      : p.gameState === "upcoming"
        ? "Yet to play"
        : p.gameState === "live"
          ? "Playing"
          : "Final";
  const diff = p.points - p.projected;

  let score: React.ReactNode;
  if (p.gameState === "bye") {
    score = <span className="text-sm text-neutral-400">—</span>;
  } else if (p.gameState === "upcoming") {
    score = (
      <>
        <div className="text-sm tabular-nums text-neutral-400">proj {p.projected.toFixed(1)}</div>
        <div className="text-[11px] text-neutral-400">
          {p.kickoff !== null && <Kickoff ts={p.kickoff} />}
        </div>
      </>
    );
  } else {
    score = (
      <>
        <div className="text-base font-semibold tabular-nums">{p.points.toFixed(1)}</div>
        <div className="text-[11px] tabular-nums text-neutral-400">
          {p.gameState === "final" && Math.abs(diff) >= 0.5 && (
            <span className={diff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
              {diff > 0 ? "▲" : "▼"}{" "}
            </span>
          )}
          proj {p.projected.toFixed(1)}
        </div>
      </>
    );
  }

  // On phones the score stacks under the name so names get the full
  // column width; from sm up it sits beside the name, toward the middle.
  return (
    <div
      className={`flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2 ${
        right ? "items-end sm:flex-row-reverse" : "items-start"
      }`}
    >
      <div className={`w-full min-w-0 sm:w-auto ${right ? "text-right" : ""}`}>
        <div className="truncate text-sm">{p.name}</div>
        <div className="text-[11px] text-neutral-400">
          {p.proTeam} ·{" "}
          {p.gameState === "live" ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{status}</span>
          ) : (
            status
          )}
        </div>
      </div>
      <div
        className={`whitespace-nowrap sm:w-20 sm:flex-shrink-0 ${
          right ? "text-right sm:text-left" : "text-left sm:text-right"
        }`}
      >
        {score}
      </div>
    </div>
  );
}

function SideHeader({ side, align }: { side: MatchupSide; align: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="truncate font-semibold">{side.teamName}</div>
      <div className="text-xs text-neutral-500">
        {side.record}
        {side.winProbability !== null && <> · {Math.round(side.winProbability * 100)}% to win</>}
      </div>
      <div className="text-2xl font-bold tabular-nums">{side.points.toFixed(1)}</div>
      <div className="text-xs text-neutral-500">Projected {side.projectedTotal.toFixed(1)}</div>
    </div>
  );
}

const yetToPlay = (side: MatchupSide) =>
  side.starters.filter((p) => p.gameState === "upcoming").length;

function MatchupDetail({ matchup }: { matchup: Matchup }) {
  const { home, away } = matchup;
  const rows = Math.max(home.starters.length, away.starters.length);
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid grid-cols-[1fr_2.25rem_1fr] sm:grid-cols-[1fr_3rem_1fr] items-end border-b border-neutral-100 px-3 py-3 sm:px-4 dark:border-neutral-800">
        <SideHeader side={home} align="left" />
        <div className="pb-1 text-center text-xs text-neutral-400">vs</div>
        <SideHeader side={away} align="right" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_2.25rem_1fr] sm:grid-cols-[1fr_3rem_1fr] items-center border-b border-neutral-100 px-3 py-2 sm:px-4 dark:border-neutral-800"
        >
          <PlayerCell p={home.starters[i]} align="left" />
          <div className="text-center text-[11px] font-medium text-neutral-400">
            {home.starters[i]?.lineupSlot ?? away.starters[i]?.lineupSlot}
          </div>
          <PlayerCell p={away.starters[i]} align="right" />
        </div>
      ))}
      <div className="grid grid-cols-[1fr_2.25rem_1fr] sm:grid-cols-[1fr_3rem_1fr] bg-neutral-50 px-3 py-2.5 text-xs sm:px-4 text-neutral-500 dark:bg-neutral-950">
        <div>{yetToPlay(home)} yet to play</div>
        <div />
        <div className="text-right">{yetToPlay(away)} yet to play</div>
      </div>
    </div>
  );
}

export default function MatchupsView({
  matchups,
  autoRefresh,
}: {
  matchups: Matchup[];
  autoRefresh: boolean; // current week with games still to finish
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(0);

  // Re-fetch every minute while games are live, but not in a background
  // tab -- and once more as soon as the tab comes back into view.
  useEffect(() => {
    if (!autoRefresh) return;
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [autoRefresh, router]);

  const current = matchups[Math.min(selected, matchups.length - 1)];

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {matchups.map((m, i) => {
          const homeLeads = m.home.points >= m.away.points;
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`rounded-lg border bg-white p-2.5 text-left text-xs transition-colors dark:bg-neutral-900 ${
                i === selected
                  ? "border-blue-500 ring-1 ring-blue-500"
                  : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
              }`}
            >
              {[m.home, m.away].map((side, j) => (
                <div
                  key={side.teamId}
                  className={`flex justify-between gap-2 ${
                    (j === 0) === homeLeads ? "font-semibold" : "text-neutral-500"
                  }`}
                >
                  <span className="truncate">{side.teamName}</span>
                  <span className="tabular-nums">{side.points.toFixed(1)}</span>
                </div>
              ))}
              {m.home.winProbability !== null && (
                <div className="mt-1.5 h-1 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${Math.round(m.home.winProbability * 100)}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {current && <MatchupDetail matchup={current} />}
    </div>
  );
}
