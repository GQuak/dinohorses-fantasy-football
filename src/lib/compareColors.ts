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

// Shape of one team's color set (A or B) -- used by components that accept
// "whichever team's colors" as a prop rather than hardcoding A or B.
export type CompareTeamColor = (typeof COMPARE_COLORS)[keyof typeof COMPARE_COLORS];
