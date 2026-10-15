"use client";

import { useRef, useState, type MouseEvent } from "react";
import ModeToggle from "./ModeToggle";
import { rankFraction } from "@/lib/rank";
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

export default function PositionStrengthRadar({
  axes,
  mode,
  onModeChange,
  currentWeek,
}: {
  axes: PositionAxisRank[];
  mode: "season" | "week";
  onModeChange: (mode: "season" | "week") => void;
  currentWeek: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Tooltip follows the pointer, so its position is pixel coordinates
  // relative to the chart container, not the axis's own data point.
  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null);
  const totalTeams = axes[0]?.totalTeams ?? 1;

  // Rank 1 (best) plots at the outer edge; fraction of the radius. Zeroed
  // out when this team has no points at that axis at all (e.g. pre-season,
  // or a bye) -- otherwise a tie among several zero-value teams still gets
  // *some* rank from the sort, which would draw a shape implying a real
  // difference that doesn't exist yet.
  const starterFractions = axes.map((a) =>
    a.starterValue > 0 ? rankFraction(a.starterRank, totalTeams) : 0
  );

  function trackPointer(index: number, e: MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ index, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const hoveredAxis = hover ? axes[hover.index] : null;
  const hoveredLabel = hoveredAxis && (hoveredAxis.starterRank > 0 ? `#${hoveredAxis.starterRank}` : "—");

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Position Strength</h3>
        <ModeToggle mode={mode} onChange={onModeChange} currentWeek={currentWeek} />
      </div>

      {/* The SVG below is purely visual (no event handlers -- SVG shape
          elements have historically flaky React hover-event behavior).
          Hover/tap targets are plain HTML elements absolutely positioned
          on top, at each axis's data point; the tooltip itself tracks the
          pointer directly (pixel coordinates from mouse events) rather
          than being CSS-anchored to its trigger, sidestepping any
          conflicting-utility-class positioning bugs entirely. */}
      <div
        ref={containerRef}
        className="relative mx-auto aspect-square w-full max-w-xs"
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pointer-events-none h-full w-full">
          {/* Plot-area background -- without this, the grid was nearly
              invisible against the card's own dark background in dark
              mode. One step lighter than the card, so the chart reads as
              its own surface without competing with the data polygon. */}
          <polygon
            points={polygonPoints(axes.map(() => 1), RADIUS)}
            className="fill-neutral-100 dark:fill-neutral-800"
          />
          {GRID_RINGS.map((f) => (
            <polygon
              key={f}
              points={polygonPoints(axes.map(() => f), RADIUS)}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              className="text-neutral-300 dark:text-neutral-600"
            />
          ))}
          {axes.map((a, i) => {
            const { x, y } = axisPoint(i, axes.length, RADIUS);
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
          <polygon
            points={polygonPoints(starterFractions, RADIUS)}
            fill="#3b82f6"
            fillOpacity={0.32}
            stroke="#3b82f6"
            strokeWidth={2}
          />
          {axes.map((a, i) => {
            const { x, y } = axisPoint(i, axes.length, starterFractions[i] * RADIUS);
            return <circle key={a.axis} cx={x} cy={y} r={5} fill="#3b82f6" stroke="white" strokeWidth={1.5} />;
          })}
          {axes.map((a, i) => {
            const { x, y } = axisPoint(i, axes.length, RADIUS + 20);
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

        {axes.map((a, i) => {
          const { x, y } = axisPoint(i, axes.length, starterFractions[i] * RADIUS);
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

        {hover && (
          <div
            className="pointer-events-none absolute z-20 w-max max-w-[120px] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-md bg-neutral-900 px-2 py-1 text-center text-xs font-semibold text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900"
            style={{ left: hover.x, top: hover.y }}
          >
            {hoveredLabel}
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> Starters
        </span>
      </div>
      <p className="mt-1 text-center text-xs text-neutral-400">
        Rank vs. the other {Math.max(totalTeams - 1, 0)} teams in this league,{" "}
        {mode === "season" ? "by season projected points" : `for week ${currentWeek}'s projections`}. Outer
        edge = #1. Tap or hover a point for its rank.
      </p>
    </div>
  );
}
