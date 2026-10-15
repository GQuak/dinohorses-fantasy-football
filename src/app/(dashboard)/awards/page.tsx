import Link from "next/link";
import { AWARD_CATEGORIES, AWARDS, getAward } from "@/lib/awards";
import { getAllEarnedAwards, getLatestRecap, type EarnedAward } from "@/lib/recapData";

// Groups earned awards by a key (award id or team), keeping week order,
// so repeats collapse into one "×N" entry.
function groupBy<K>(earned: EarnedAward[], key: (e: EarnedAward) => K): [K, EarnedAward[]][] {
  const groups = new Map<K, EarnedAward[]>();
  for (const e of earned) {
    const list = groups.get(key(e)) ?? [];
    list.push(e);
    groups.set(key(e), list);
  }
  return [...groups.entries()];
}

function weeksLabel(list: EarnedAward[]): string {
  return `Wk ${list.map((e) => e.week).join(", ")}`;
}

export default function AwardsPage() {
  const earned = getAllEarnedAwards();
  // Every team appears in the trophy case, even with nothing in it yet --
  // the latest recap's results table is the current list of team names.
  const teamNames = getLatestRecap()?.teams.map((t) => t.team) ?? [];

  const byTeam = teamNames
    .map((team) => ({ team, awards: earned.filter((e) => e.team === team) }))
    .sort((a, b) => b.awards.length - a.awards.length || a.team.localeCompare(b.team));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Awards</h2>
        <p className="text-sm text-neutral-500">
          The season&apos;s trophy case: impressive, lucky and painful moments, handed out with
          each weekly recap.
        </p>
      </div>

      <div className="mb-8 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between px-4 pt-3">
          <h3 className="font-semibold">Trophy Case</h3>
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {earned.length} awarded
          </span>
        </div>
        <ul className="mt-2">
          {byTeam.map(({ team, awards }) => (
            <li
              key={team}
              className="flex flex-col gap-2 border-t border-neutral-100 px-4 py-3 sm:flex-row sm:items-center dark:border-neutral-900"
            >
              <div className="flex items-baseline gap-2 sm:w-52 sm:flex-shrink-0">
                <span className="font-medium">{team}</span>
                <span className="text-xs tabular-nums text-neutral-400">{awards.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {awards.length === 0 && (
                  <span className="text-xs text-neutral-400">No awards yet</span>
                )}
                {groupBy(awards, (e) => e.award).map(([id, list]) => {
                  const award = getAward(id);
                  return (
                    <span
                      key={id}
                      title={`${award.name}: ${award.description} (${weeksLabel(list)})`}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      <span aria-hidden>{award.emoji}</span>
                      {award.name}
                      {list.length > 1 && (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          ×{list.length}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {AWARD_CATEGORIES.map((cat) => (
        <div key={cat.id} className="mb-6">
          <h3 className="mb-3 font-semibold">
            <span aria-hidden>{cat.emoji}</span> {cat.label}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {AWARDS.filter((a) => a.category === cat.id).map((award) => {
              const winners = groupBy(
                earned.filter((e) => e.award === award.id),
                (e) => e.team
              );
              return (
                <div
                  key={award.id}
                  className="flex gap-3 rounded-lg border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <span className="text-2xl leading-none" aria-hidden>
                    {award.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{award.name}</div>
                    <p className="text-xs text-neutral-500">{award.description}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      {winners.length === 0 ? (
                        <span className="text-neutral-400">
                          {cat.id === "season" ? "Awarded at season end" : "Not yet earned"}
                        </span>
                      ) : (
                        winners.map(([team, list]) => (
                          <div key={team} className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-medium">{team}</span>
                            {list.length > 1 && (
                              <span className="font-semibold text-amber-600 dark:text-amber-400">
                                ×{list.length}
                              </span>
                            )}
                            <span className="text-neutral-400">
                              {list.map((e, i) => (
                                <span key={e.week}>
                                  {i > 0 && ", "}
                                  <Link href={`/recap/${e.week}`} className="hover:underline">
                                    Wk {e.week}
                                  </Link>
                                </span>
                              ))}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
