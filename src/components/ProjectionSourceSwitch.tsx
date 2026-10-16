"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PROJECTION_SOURCES, type ProjectionSource } from "@/lib/projections";

// Which rest-of-season projections the Trade Analyzer uses. Kept in the
// URL (?src=) alongside the trade itself, so a shared link shows the
// same numbers.
export default function ProjectionSourceSwitch({ source }: { source: ProjectionSource }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(next: ProjectionSource) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "espn") params.delete("src");
    else params.set("src", next);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Projections
      </span>
      <div className="flex gap-1">
        {PROJECTION_SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => select(s.id)}
            className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
              source === s.id
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
