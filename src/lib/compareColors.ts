// Fixed two-team color scheme shared by every compare-page visual (radar
// overlay, grouped bars, legends, the team selector) so "Team A" and "Team
// B" mean the same color everywhere on the page. Picked to stay visually
// distinct from the Starting Lineup chart's rank-tier colors (emerald/
// amber/rose) -- same app, but a different meaning for color on this page
// (which team, not how good the rank is).
export const COMPARE_COLORS = {
  a: {
    hex: "#3b82f6", // blue-500
    bar: "bg-blue-500 dark:bg-blue-600",
    dot: "bg-blue-500",
    // For text on the card's own background (white/neutral-900).
    text: "text-blue-700 dark:text-blue-400",
    // For text inside the radar's hand-built tooltip, whose background is
    // inverted relative to the page theme (dark bubble in light mode).
    tooltipText: "text-blue-300 dark:text-blue-700",
  },
  b: {
    hex: "#8b5cf6", // violet-500
    bar: "bg-violet-500 dark:bg-violet-600",
    dot: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-400",
    tooltipText: "text-violet-300 dark:text-violet-700",
  },
} as const;

// Shape of one series' color set -- used by components that accept
// "whichever team's colors" as a prop rather than hardcoding A or B.
export interface CompareTeamColor {
  hex: string;
  bar: string;
  dot: string;
  text: string;
  tooltipText: string;
}

// Trade Analyzer's before/after radar: grey for before, and green or red
// for after depending on whether the team's lineup gains or loses points.
export const TRADE_COLORS = {
  before: {
    hex: "#a3a3a3", // neutral-400
    bar: "bg-neutral-400 dark:bg-neutral-500",
    dot: "bg-neutral-400",
    text: "text-neutral-500 dark:text-neutral-400",
    tooltipText: "text-neutral-300 dark:text-neutral-600",
  },
  up: {
    hex: "#10b981", // emerald-500
    bar: "bg-emerald-500 dark:bg-emerald-600",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    tooltipText: "text-emerald-300 dark:text-emerald-700",
  },
  down: {
    hex: "#f43f5e", // rose-500
    bar: "bg-rose-500 dark:bg-rose-600",
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-400",
    tooltipText: "text-rose-300 dark:text-rose-700",
  },
} satisfies Record<string, CompareTeamColor>;
