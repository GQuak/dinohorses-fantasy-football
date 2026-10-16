"use client";

import { useState } from "react";
import CompareRadar from "./CompareRadar";
import ModeToggle from "./ModeToggle";
import { COMPARE_COLORS, TRADE_COLORS, type CompareTeamColor } from "@/lib/compareColors";
import type { TradeMode, TradeResult, TradeTeamResult } from "@/lib/trade";
import type { RosterPlayer } from "@/lib/types";

// Below this many points per week, a lineup change is noise -- both
// teams "gaining" 0.3 isn't a meaningful winner.
const EVEN_THRESHOLD = 0.5;

function signed(n: number): string {
  return `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}`;
}

function deltaClass(n: number, invert = false): string {
  const good = invert ? n < 0 : n > 0;
  if (Math.abs(n) < 0.05) return "text-neutral-500";
  return good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
}

// Lineup change per week: rest-of-season totals are spread over the
// remaining weeks so both modes read in the same "points per week" units.
function weeklyLineupDelta(team: TradeTeamResult, mode: TradeMode, weeksRemaining: number): number {
  const m = team.modes[mode];
  const delta = m.lineupAfter - m.lineupBefore;
  return mode === "season" ? delta / weeksRemaining : delta;
}

function Verdict({
  result,
  mode,
}: {
  result: TradeResult;
  mode: TradeMode;
}) {
  const [a, b] = result.teams;
  const da = weeklyLineupDelta(a, mode, result.weeksRemaining);
  const db = weeklyLineupDelta(b, mode, result.weeksRemaining);
  const unit = mode === "season" ? "pts/week for the rest of the season" : "pts this week";

  let headline: string;
  if (Math.abs(da - db) < EVEN_THRESHOLD) headline = "Pretty even trade";
  else headline = `${da > db ? a.teamName : b.teamName} wins this trade`;

  return (
    <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Verdict</div>
      <div className="mt-1 text-xl font-bold">{headline}</div>
      <p className="mt-1 text-sm text-neutral-500">
        Best possible starting lineup:{" "}
        <span className={`font-semibold ${deltaClass(da)}`}>{a.teamName} {signed(da)}</span>,{" "}
        <span className={`font-semibold ${deltaClass(db)}`}>{b.teamName} {signed(db)}</span> {unit}.
      </p>
    </div>
  );
}

function PlayerRow({ p, tag }: { p: RosterPlayer; tag?: string }) {
  return (
    <li className="flex items-baseline justify-between gap-2 py-1 text-sm">
      <span className="min-w-0 truncate">
        {p.name}{" "}
        <span className="text-xs text-neutral-400">
          {p.position} · {p.proTeam}
          {p.injuryStatus && <span className="ml-1 text-rose-500">{p.injuryStatus}</span>}
          {tag && <span className="ml-1">· {tag}</span>}
        </span>
      </span>
      <span className="flex-shrink-0 text-xs tabular-nums text-neutral-500">
        {p.projectedPoints.toFixed(1)} ROS · {p.avgPoints.toFixed(1)}/gm
      </span>
    </li>
  );
}

function PlayerList({ title, players, tag }: { title: string; players: RosterPlayer[]; tag?: string }) {
  if (players.length === 0) return null;
  const total = players.reduce((s, p) => s + p.projectedPoints, 0);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-neutral-500">
        <span>{title}</span>
        <span className="tabular-nums">{total.toFixed(1)} ROS</span>
      </div>
      <ul>
        {players.map((p) => (
          <PlayerRow key={p.playerId} p={p} tag={tag} />
        ))}
      </ul>
    </div>
  );
}

function MetricRow({
  label,
  before,
  after,
  format,
  delta,
  invert,
}: {
  label: string;
  before: number;
  after: number;
  format: (n: number) => string;
  delta: number;
  invert?: boolean;
}) {
  return (
    <tr className="border-t border-neutral-100 dark:border-neutral-800">
      <td className="py-1.5 text-neutral-500">{label}</td>
      <td className="py-1.5 text-right tabular-nums">{format(before)}</td>
      <td className="py-1.5 text-right tabular-nums">{format(after)}</td>
      <td className={`py-1.5 text-right font-semibold tabular-nums ${deltaClass(delta, invert)}`}>
        {Math.abs(delta) < 0.05 ? "—" : invert ? (delta < 0 ? `▲${-delta}` : `▼${delta}`) : signed(delta)}
      </td>
    </tr>
  );
}

function TeamCard({
  team,
  color,
  mode,
  weeksRemaining,
}: {
  team: TradeTeamResult;
  color: CompareTeamColor;
  mode: TradeMode;
  weeksRemaining: number;
}) {
  const m = team.modes[mode];
  const lineupLabel = mode === "season" ? "Lineup, rest of season" : "Lineup, this week";
  const rankChanges = m.axesBefore
    .map((before, i) => ({ before, after: m.axesAfter[i] }))
    .filter(({ before, after }) => before.starterRank !== after.starterRank);

  return (
    <div className="flex-1 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h3 className={`flex items-center gap-1.5 font-semibold ${color.text}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} /> {team.teamName}
      </h3>

      <PlayerList title="Gets" players={team.received} />
      <PlayerList title="Gives" players={team.sent} />
      <PlayerList title="Drops to make room" players={team.dropped} />
      <PlayerList title="Picks up (best free agent)" players={team.pickedUp} tag="FA" />

      <table className="mt-4 w-full text-sm">
        <thead className="text-[10px] uppercase tracking-wide text-neutral-400">
          <tr>
            <th className="text-left font-semibold" />
            <th className="text-right font-semibold">Before</th>
            <th className="text-right font-semibold">After</th>
            <th className="text-right font-semibold">Change</th>
          </tr>
        </thead>
        <tbody>
          <MetricRow
            label={lineupLabel}
            before={m.lineupBefore}
            after={m.lineupAfter}
            format={(n) => n.toFixed(1)}
            delta={m.lineupAfter - m.lineupBefore}
          />
          {mode === "season" && (
            <MetricRow
              label="Per week"
              before={m.lineupBefore / weeksRemaining}
              after={m.lineupAfter / weeksRemaining}
              format={(n) => n.toFixed(1)}
              delta={(m.lineupAfter - m.lineupBefore) / weeksRemaining}
            />
          )}
          <MetricRow
            label="Power score"
            before={m.powerBefore}
            after={m.powerAfter}
            format={(n) => n.toFixed(1)}
            delta={m.powerAfter - m.powerBefore}
          />
          <MetricRow
            label="Power rank"
            before={m.rankBefore}
            after={m.rankAfter}
            format={(n) => `#${n}`}
            delta={m.rankAfter - m.rankBefore}
            invert
          />
        </tbody>
      </table>

      <div className="mt-4">
        <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
          Position strength ranks
        </div>
        {rankChanges.length === 0 ? (
          <p className="mt-1 text-sm text-neutral-400">No change at any position.</p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {rankChanges.map(({ before, after }) => {
              const better = after.starterRank < before.starterRank;
              return (
                <span
                  key={before.axis}
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                    better
                      ? "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-400"
                      : "border-rose-200 text-rose-700 dark:border-rose-900 dark:text-rose-400"
                  }`}
                >
                  {before.axis}: #{before.starterRank} → #{after.starterRank}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TradeResults({
  result,
  currentWeek,
}: {
  result: TradeResult;
  currentWeek: number;
}) {
  const [mode, setMode] = useState<TradeMode>("season");
  const [a, b] = result.teams;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Trade Analysis</h3>
        <ModeToggle mode={mode} onChange={setMode} currentWeek={currentWeek} />
      </div>

      <Verdict result={result} mode={mode} />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <TeamCard team={a} color={COMPARE_COLORS.a} mode={mode} weeksRemaining={result.weeksRemaining} />
        <TeamCard team={b} color={COMPARE_COLORS.b} mode={mode} weeksRemaining={result.weeksRemaining} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[a, b].map((team) => {
          // "After" is green when the team's best lineup scores more after
          // the trade, red when it scores less, in whichever mode is shown.
          const m = team.modes[mode];
          const afterColor = m.lineupAfter >= m.lineupBefore ? TRADE_COLORS.up : TRADE_COLORS.down;
          return (
            <div key={team.teamId}>
              <div className="mb-1 text-sm font-medium">{team.teamName}: before vs. after</div>
              <CompareRadar
                axesA={m.axesBefore}
                axesB={m.axesAfter}
                labelA="Before"
                labelB="After"
                colorA={TRADE_COLORS.before}
                colorB={afterColor}
                mode={mode}
                onModeChange={setMode}
                currentWeek={currentWeek}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
