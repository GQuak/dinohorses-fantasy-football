"use client";

import { useRef, useState, type MouseEvent } from "react";

const WIDTH = 700;
const HEIGHT = 340;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

type Mode = "cumulative" | "weekly";

// One line's data, identified by a string id (the team's id).
export interface ChartSeries {
  id: string;
  teamName: string;
  points: number[];
  weeklyPoints: number[];
}

// 12 visually distinct hues -- enough for a full 12-team league without
// two teams landing on near-identical colors.
const PALETTE = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#06b6d4",
  "#a855f7",
];

export default function CumulativePointsChart({
  title,
  weeks,
  series,
}: {
  title: string;
  weeks: number[];
  series: ChartSeries[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("cumulative");
  const [hoverWeekIdx, setHoverWeekIdx] = useState<number | null>(null);
  const [legendHoverId, setLegendHoverId] = useState<string | null>(null);

  if (weeks.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-neutral-500">
          No completed weeks yet -- check back once week 1 wraps up.
        </p>
      </div>
    );
  }

  const valuesFor = (s: ChartSeries) => (mode === "cumulative" ? s.points : s.weeklyPoints);

  // Legend order is always by season-to-date total (not the active mode)
  // -- otherwise a team's position would reshuffle every time the toggle
  // is switched, undoing the "hover a legend entry to track one team"
  // affordance.
  const bySeasonTotal = [...series].sort(
    (a, b) => (b.points[b.points.length - 1] ?? 0) - (a.points[a.points.length - 1] ?? 0)
  );
  const colorFor = (id: string) =>
    PALETTE[bySeasonTotal.findIndex((s) => s.id === id) % PALETTE.length];

  const maxValue = Math.max(1, ...series.flatMap((s) => valuesFor(s))) * 1.08;

  function xFor(i: number) {
    return weeks.length > 1 ? PAD.left + (i / (weeks.length - 1)) * PLOT_W : PAD.left + PLOT_W / 2;
  }
  function yFor(v: number) {
    return PAD.top + PLOT_H - (v / maxValue) * PLOT_H;
  }

  function handleMove(e: MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const viewBoxX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const frac = (viewBoxX - PAD.left) / PLOT_W;
    const idx = Math.round(frac * (weeks.length - 1));
    setHoverWeekIdx(Math.min(weeks.length - 1, Math.max(0, idx)));
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));
  const xLabelStep = Math.max(1, Math.ceil(weeks.length / 8));

  const hoverRows =
    hoverWeekIdx !== null
      ? [...series]
          .map((s) => ({ id: s.id, teamName: s.teamName, value: valuesFor(s)[hoverWeekIdx] ?? 0 }))
          .sort((a, b) => b.value - a.value)
      : [];
  const tooltipOnRight = hoverWeekIdx !== null && hoverWeekIdx < weeks.length / 2;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex gap-1">
          {(
            [
              { key: "cumulative", label: "Cumulative" },
              { key: "weekly", label: "Weekly" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMode(opt.key)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === opt.key
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverWeekIdx(null)}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-full w-full">
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={yFor(t)}
                y2={yFor(t)}
                stroke="currentColor"
                strokeWidth={1}
                className="text-neutral-200 dark:text-neutral-800"
              />
              <text
                x={PAD.left - 6}
                y={yFor(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-neutral-400 text-[10px]"
              >
                {t}
              </text>
            </g>
          ))}

          {weeks.map(
            (w, i) =>
              i % xLabelStep === 0 && (
                <text
                  key={w}
                  x={xFor(i)}
                  y={HEIGHT - PAD.bottom + 18}
                  textAnchor="middle"
                  className="fill-neutral-400 text-[10px]"
                >
                  W{w}
                </text>
              )
          )}

          {hoverWeekIdx !== null && (
            <line
              x1={xFor(hoverWeekIdx)}
              x2={xFor(hoverWeekIdx)}
              y1={PAD.top}
              y2={HEIGHT - PAD.bottom}
              stroke="currentColor"
              strokeWidth={1}
              className="text-neutral-300 dark:text-neutral-700"
            />
          )}

          {series.map((s) => {
            const color = colorFor(s.id);
            const dimmed = legendHoverId !== null && legendHoverId !== s.id;
            const points = valuesFor(s)
              .map((v, i) => `${xFor(i)},${yFor(v)}`)
              .join(" ");
            return (
              <polyline
                key={s.id}
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={legendHoverId === s.id ? 3 : 1.75}
                strokeOpacity={dimmed ? 0.15 : 1}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}

          {/* A circle at every week's data point, not just the hovered one
              -- the hovered week's (and a legend-highlighted team's) circles
              just draw larger on top. */}
          {series.map((s) => {
            const color = colorFor(s.id);
            const dimmed = legendHoverId !== null && legendHoverId !== s.id;
            const highlighted = legendHoverId === s.id;
            return (
              <g key={s.id}>
                {valuesFor(s).map((v, i) => {
                  const isHoverWeek = hoverWeekIdx === i;
                  return (
                    <circle
                      key={i}
                      cx={xFor(i)}
                      cy={yFor(v)}
                      r={highlighted || isHoverWeek ? 4 : 2.5}
                      fill={color}
                      stroke="white"
                      strokeWidth={highlighted || isHoverWeek ? 1.5 : 1}
                      opacity={dimmed ? 0.15 : 1}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {hoverWeekIdx !== null && (
          <div
            className="pointer-events-none absolute z-20 w-max max-w-[220px] rounded-md bg-neutral-900 p-2 text-xs shadow-lg dark:bg-neutral-100"
            style={{
              left: `${(xFor(hoverWeekIdx) / WIDTH) * 100}%`,
              top: `${(PAD.top / HEIGHT) * 100}%`,
              transform: tooltipOnRight ? "translate(10px, 0)" : "translate(calc(-100% - 10px), 0)",
            }}
          >
            <div className="mb-1 font-bold text-white dark:text-neutral-900">
              Week {weeks[hoverWeekIdx]}
            </div>
            {hoverRows.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-1.5 py-0.5 text-neutral-200 dark:text-neutral-700"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colorFor(r.id) }}
                />
                <span className="max-w-[120px] flex-1 truncate">{r.teamName}</span>
                <span className="font-semibold tabular-nums text-white dark:text-neutral-900">
                  {r.value.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-neutral-500">
        {bySeasonTotal.map((s) => (
          <button
            key={s.id}
            type="button"
            onMouseEnter={() => setLegendHoverId(s.id)}
            onMouseLeave={() => setLegendHoverId(null)}
            className="flex items-center gap-1.5"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: colorFor(s.id) }}
            />
            <span
              className={`max-w-[140px] truncate ${
                legendHoverId === s.id ? "font-semibold text-neutral-900 dark:text-neutral-100" : ""
              }`}
            >
              {s.teamName}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-neutral-400">
        {mode === "cumulative"
          ? `Running total of actual starter points through week ${weeks[weeks.length - 1]}.`
          : "Actual starter points scored in each individual week."}{" "}
        Hover the chart for a week-by-week breakdown, or a team name to highlight its line.
      </p>
    </div>
  );
}
