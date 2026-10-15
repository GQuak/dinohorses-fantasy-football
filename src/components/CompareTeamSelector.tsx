"use client";

import { usePathname, useRouter } from "next/navigation";
import { COMPARE_COLORS, type CompareTeamColor } from "@/lib/compareColors";

export interface CompareTeamOption {
  key: string; // `${leagueId}::${teamId}`
  label: string;
}

function TeamSelect({
  options,
  value,
  otherValue,
  onChange,
  color,
  slotLabel,
}: {
  options: CompareTeamOption[];
  value: string;
  otherValue: string;
  onChange: (key: string) => void;
  color: CompareTeamColor;
  slotLabel: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-sm">
      <span className={`flex items-center gap-1.5 font-medium ${color.text}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} /> {slotLabel}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        {options.map((opt) => (
          // Disabled (not hidden) so the other side's pick still shows
          // as a taken option, rather than silently disappearing.
          <option key={opt.key} value={opt.key} disabled={opt.key === otherValue}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CompareTeamSelector({
  options,
  a,
  b,
}: {
  options: CompareTeamOption[];
  a: string;
  b: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function update(next: { a?: string; b?: string }) {
    const params = new URLSearchParams();
    params.set("a", next.a ?? a);
    params.set("b", next.b ?? b);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row">
      <TeamSelect
        options={options}
        value={a}
        otherValue={b}
        onChange={(key) => update({ a: key })}
        color={COMPARE_COLORS.a}
        slotLabel="Team A"
      />
      <TeamSelect
        options={options}
        value={b}
        otherValue={a}
        onChange={(key) => update({ b: key })}
        color={COMPARE_COLORS.b}
        slotLabel="Team B"
      />
    </div>
  );
}
