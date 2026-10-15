import Link from "next/link";
import type { RecapCard, RecapTeamRow, WeeklyRecap } from "@/lib/recapData";

// Same fixed scale as the diff bars everywhere else in this app -- large
// enough to cover a real blowout week without the bar ever fully maxing
// out, so a +49 week still reads as "very large" rather than "the largest
// possible."
const DIFF_SCALE = 50;

function diffBarWidth(diff: number): number {
  return Math.min(100, Math.round((Math.abs(diff) / DIFF_SCALE) * 1000) / 10);
}

function DiffCell({ diff }: { diff: number }) {
  const width = diffBarWidth(diff);
  const positive = diff >= 0;
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="relative h-2.5 w-20 flex-shrink-0">
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-neutral-300 dark:bg-neutral-700" />
        {positive ? (
          <div
            className="absolute inset-y-0 left-1/2 rounded-r bg-emerald-400 dark:bg-emerald-600"
            style={{ width: `${width / 2}%` }}
          />
        ) : (
          <div
            className="absolute inset-y-0 right-1/2 rounded-l bg-rose-400 dark:bg-rose-600"
            style={{ width: `${width / 2}%` }}
          />
        )}
      </div>
      <span
        className={`w-14 flex-shrink-0 text-right font-semibold tabular-nums ${
          positive
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-rose-700 dark:text-rose-400"
        }`}
      >
        {positive ? "+" : "−"}
        {Math.abs(diff).toFixed(1)}
      </span>
    </div>
  );
}

function TeamsTable({ teams }: { teams: RecapTeamRow[] }) {
  return (
    <div className="overflow-x-auto">
      {/* table-layout: fixed + an explicit colgroup, not auto layout --
          otherwise the Team column's max-w-0/truncate trick backfires: the
          Diff column's fixed-width bar chart dominates the auto-layout
          algorithm's sizing pass and squeezes Team down to near nothing
          instead of the other way around. */}
      <table className="w-full min-w-[420px] table-fixed text-sm">
        <colgroup>
          <col className="w-6" />
          <col />
          <col className="w-16" />
          <col className="w-16" />
          <col className="w-36" />
        </colgroup>
        <thead className="bg-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Team</th>
            <th className="px-3 py-2 text-right">Actual</th>
            <th className="px-3 py-2 text-right">Proj</th>
            <th className="px-3 py-2 text-right">Diff</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr key={t.team} className="border-t border-neutral-100 dark:border-neutral-900">
              <td className="px-3 py-2 text-neutral-500">{i + 1}</td>
              <td
                className={`max-w-0 truncate px-3 py-2 font-medium ${
                  i === 0 ? "text-amber-600 dark:text-amber-400" : ""
                }`}
              >
                {t.team}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{t.actual.toFixed(1)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-neutral-500">
                {t.projected.toFixed(1)}
              </td>
              <td className="px-3 py-2 text-right">
                <DiffCell diff={t.actual - t.projected} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StandoutCard({ card }: { card: RecapCard }) {
  const boom = card.kind === "boom";
  return (
    <div
      className={`rounded-lg border-l-4 border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900 ${
        boom ? "border-l-emerald-400 dark:border-l-emerald-600" : "border-l-rose-400 dark:border-l-rose-600"
      }`}
    >
      <div
        className={`text-[10px] font-bold uppercase tracking-wide ${
          boom ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
        }`}
      >
        {boom ? "Boom" : "Bust"}
        {card.offBench ? " · off the bench" : ""}
      </div>
      <div className="mt-1 font-semibold">{card.name}</div>
      <div className="text-xs text-neutral-500">
        {card.position} · {card.proTeam}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`text-2xl font-bold tabular-nums ${
            boom ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {card.actual.toFixed(1)}
        </span>
        <span className="text-xs tabular-nums text-neutral-400">proj {card.projected.toFixed(1)}</span>
      </div>
      <p className="mt-2 text-xs text-neutral-500">{card.note}</p>
    </div>
  );
}

// Every published week gets its own permalink (/recap/[week]) rather than
// all weeks fighting over one URL -- this is the pill row that moves
// between them. Plain links, not a client-side toggle: each week is a
// genuinely different page (different data), so a real navigation with
// its own shareable URL is the right model, not client state.
function WeekPills({ weeks, currentWeek }: { weeks: number[]; currentWeek: number }) {
  if (weeks.length < 2) return null;
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {weeks.map((w) => (
        <Link
          key={w}
          href={`/recap/${w}`}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            w === currentWeek
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
              : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
          }`}
        >
          Week {w}
        </Link>
      ))}
    </div>
  );
}

export default function WeeklyRecapView({
  recap,
  allWeeks,
}: {
  recap: WeeklyRecap;
  allWeeks: number[];
}) {
  const { headline } = recap;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Week {recap.week} Recap</h2>
        <p className="text-sm text-neutral-500">
          Who beat their number and who bombed it.
        </p>
      </div>

      <WeekPills weeks={allWeeks} currentWeek={recap.week} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Top Score
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {headline.topScore.toFixed(1)}
          </div>
          <div className="mt-1 text-sm text-neutral-500">
            {headline.topScoreTeam}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Biggest Beat
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            +{headline.biggestBeat.toFixed(1)}
          </div>
          <div className="mt-1 text-sm text-neutral-500">
            {headline.biggestBeatTeam}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Biggest Bust
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
            {headline.biggestBust.toFixed(1)}
          </div>
          <div className="mt-1 text-sm text-neutral-500">
            {headline.biggestBustTeam}
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between px-4 pt-3">
          <h3 className="font-semibold">Results</h3>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {recap.teams.length} teams
          </span>
        </div>
        <div className="mt-2">
          <TeamsTable teams={recap.teams} />
        </div>
        <div className="space-y-2 border-t border-neutral-100 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-900">
          {recap.notes.map((note, i) => (
            <p key={i}>{note}</p>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 font-semibold">Standout Performances</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recap.standouts.map((card) => (
            <StandoutCard key={`${card.kind}-${card.name}`} card={card} />
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="px-4 pt-4 font-semibold">Odds &amp; Ends</h3>
        <ul className="mt-2">
          {recap.facts.map((fact, i) => (
            <li
              key={i}
              className="flex gap-2 border-t border-neutral-100 px-4 py-3 text-sm text-neutral-500 first:border-t-0 dark:border-neutral-900"
            >
              <span className="text-amber-500">&mdash;</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="pb-2 text-xs text-neutral-400">
        Scores are each team&apos;s starters&apos; actual vs. projected points, computed live from
        ESPN&apos;s per-player weekly stats — the same method as the Total row on each team&apos;s
        roster page.
      </p>
    </div>
  );
}
