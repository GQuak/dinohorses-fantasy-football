"use client";

import { useRef, useState, type MouseEvent } from "react";
import ModeToggle from "./ModeToggle";
import { rankFraction } from "@/lib/rank";
import { COMPARE_COLORS, type CompareTeamColor } from "@/lib/compareColors";
import type { PositionAxisRank } from "@/lib/types";

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 108;
const GRID_RINGS = [0.25, 0.5, 0.75, 1];

function axisPoint(index: number, total: number, radius: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}

function polygonPoints(values: number[], radius: number) {
  return values
    .map((v, i) => {
      const { x, y } = axisPoint(i, values.length, Math.max(0, v) * radius);
      return `${x},${y}`;
    })
    .join(" ");
}

// Two-series version of PositionStrengthRadar: same axes, same grid, but
// two overlapping colored polygons (one per team) instead of one.
export default function CompareRadar({
  axesA,
  axesB,
  labelA,
  labelB,
  colorA = COMPARE_COLORS.a,
  colorB = COMPARE_COLORS.b,
  mode,
  onModeChange,
  currentWeek,
}: {
  axesA: PositionAxisRank[];
  axesB: PositionAxisRank[];
  labelA: string;
  labelB: string;
  colorA?: CompareTeamColor;
  colorB?: CompareTeamColor;
  mode: "season" | "week";
  onModeChange: (mode: "season" | "week") => void;
  currentWeek: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null);
  const totalTeams = axesA[0]?.totalTeams ?? axesB[0]?.totalTeams ?? 1;

  const fractionsA = axesA.map((a) =>
    a.starterValue > 0 ? rankFraction(a.starterRank, a.totalTeams) : 0
  );
  const fractionsB = axesB.map((a) =>
    a.starterValue > 0 ? rankFraction(a.starterRank, a.totalTeams) : 0
  );

  function trackPointer(index: number, e: MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ index, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const hoveredA = hover ? axesA[hover.index] : null;
  const hoveredB = hover ? axesB[hover.index] : null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Position Strength</h3>
        <ModeToggle mode={mode} onChange={onModeChange} currentWeek={currentWeek} />
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto aspect-square w-full max-w-xs"
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pointer-events-none h-full w-full">
          <polygon
            points={polygonPoints(axesA.map(() => 1), RADIUS)}
            className="fill-neutral-100 dark:fill-neutral-800"
          />
          {GRID_RINGS.map((f) => (
            <polygon
              key={f}
              points={polygonPoints(axesA.map(() => f), RADIUS)}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              className="text-neutral-300 dark:text-neutral-600"
            />
          ))}
          {axesA.map((a, i) => {
            const { x, y } = axisPoint(i, axesA.length, RADIUS);
            return (
              <line
                key={a.axis}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeWidth={1}
                className="text-neutral-300 dark:text-neutral-600"
              />
            );
          })}

          {/* B drawn first so A's outline stays visible on top where the two overlap. */}
          <polygon
            points={polygonPoints(fractionsB, RADIUS)}
            fill={colorB.hex}
            fillOpacity={0.28}
            stroke={colorB.hex}
            strokeWidth={2}
          />
          <polygon
            points={polygonPoints(fractionsA, RADIUS)}
            fill={colorA.hex}
            fillOpacity={0.28}
            stroke={colorA.hex}
            strokeWidth={2}
          />

          {axesB.map((a, i) => {
            const { x, y } = axisPoint(i, axesB.length, fractionsB[i] * RADIUS);
            return (
              <circle
                key={`b-${a.axis}`}
                cx={x}
                cy={y}
                r={5}
                fill={colorB.hex}
                stroke="white"
                strokeWidth={1.5}
              />
            );
          })}
          {axesA.map((a, i) => {
            const { x, y } = axisPoint(i, axesA.length, fractionsA[i] * RADIUS);
            return (
              <circle
                key={`a-${a.axis}`}
                cx={x}
                cy={y}
                r={5}
                fill={colorA.hex}
                stroke="white"
                strokeWidth={1.5}
              />
            );
          })}

          {axesA.map((a, i) => {
            const { x, y } = axisPoint(i, axesA.length, RADIUS + 20);
            return (
              <text
                key={a.axis}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-neutral-600 text-[11px] font-semibold dark:fill-neutral-400"
              >
                {a.axis}
              </text>
            );
          })}
        </svg>

        {/* Hit targets sit partway along each spoke rather than at either
            team's own data point -- with two overlapping series there's no
            single "the" point to anchor a target to. */}
        {axesA.map((a, i) => {
          const { x, y } = axisPoint(i, axesA.length, RADIUS * 0.6);
          return (
            <div
              key={a.axis}
              className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${(x / SIZE) * 100}%`, top: `${(y / SIZE) * 100}%` }}
              onMouseMove={(e) => trackPointer(i, e)}
              onMouseEnter={(e) => trackPointer(i, e)}
              onClick={(e) => trackPointer(i, e)}
            />
          );
        })}

        {hover && hoveredA && hoveredB && (
          <div
            className="pointer-events-none absolute z-20 w-max max-w-[200px] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-md bg-neutral-900 px-2 py-1.5 text-center text-xs font-semibold shadow-lg dark:bg-neutral-100"
            style={{ left: hover.x, top: hover.y }}
          >
            <div className={colorA.tooltipText}>
              {labelA}: {hoveredA.starterRank > 0 ? `#${hoveredA.starterRank}` : "—"}
            </div>
            <div className={colorB.tooltipText}>
              {labelB}: {hoveredB.starterRank > 0 ? `#${hoveredB.starterRank}` : "—"}
            </div>
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${colorA.dot}`} />
          <span className="max-w-[100px] truncate">{labelA}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${colorB.dot}`} />
          <span className="max-w-[100px] truncate">{labelB}</span>
        </span>
      </div>
      <p className="mt-1 text-center text-xs text-neutral-400">
        Rank vs. the other {Math.max(totalTeams - 1, 0)} teams in each team&apos;s own league,{" "}
        {mode === "season" ? "by season projected points" : `for week ${currentWeek}'s projections`}.
        Outer edge = #1. Tap or hover an axis for both ranks.
      </p>
    </div>
  );
}
