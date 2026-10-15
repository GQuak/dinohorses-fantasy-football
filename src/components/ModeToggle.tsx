// Shared Season / Wk N toggle button pair for the Position Strength and
// Starting Lineup charts -- both take the same `mode` prop from their
// parent so one control drives both charts at once.
export default function ModeToggle({
  mode,
  onChange,
  currentWeek,
}: {
  mode: "season" | "week";
  onChange: (mode: "season" | "week") => void;
  currentWeek: number;
}) {
  return (
    <div className="flex gap-1">
      {(
        [
          { key: "season", label: "Season" },
          { key: "week", label: `Wk ${currentWeek}` },
        ] as const
      ).map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
            mode === opt.key
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
              : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
