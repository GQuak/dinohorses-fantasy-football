"use client";

import { usePathname, useRouter } from "next/navigation";

// `week` is a specific week number, or the string "season" for the
// full-season view (only meaningful when `includeSeasonOption` is set --
// the roster page doesn't use it, Standings does).
export default function WeekSelector({
  week,
  totalWeeks,
  includeSeasonOption = false,
}: {
  week: number | "season";
  totalWeeks: number;
  includeSeasonOption?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function goTo(w: number | "season") {
    router.push(`${pathname}?week=${w}`);
  }

  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  const isSeason = week === "season";

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => goTo((week as number) - 1)}
        disabled={isSeason || week <= 1}
        aria-label="Previous week"
        className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm text-neutral-600 disabled:opacity-30 dark:border-neutral-800 dark:text-neutral-400"
      >
        ←
      </button>
      <select
        value={week}
        onChange={(e) => goTo(e.target.value === "season" ? "season" : Number(e.target.value))}
        className="rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        {includeSeasonOption && <option value="season">Full Season</option>}
        {weeks.map((w) => (
          <option key={w} value={w}>
            Week {w}
          </option>
        ))}
      </select>
      <button
        onClick={() => goTo((week as number) + 1)}
        disabled={isSeason || week >= totalWeeks}
        aria-label="Next week"
        className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm text-neutral-600 disabled:opacity-30 dark:border-neutral-800 dark:text-neutral-400"
      >
        →
      </button>
    </div>
  );
}
