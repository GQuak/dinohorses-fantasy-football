import {
  FACT_CATEGORIES,
  MIDSEASON_THROUGH_WEEK,
  SEASON_FACTS,
  type FactCategory,
} from "@/lib/seasonFacts";

// Full class strings per category so Tailwind picks them up.
const ACCENTS: Record<FactCategory, { bar: string; stat: string; chip: string; ring: string }> = {
  luck: {
    bar: "bg-emerald-500",
    stat: "text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    ring: "hover:border-emerald-300 dark:hover:border-emerald-800",
  },
  consistency: {
    bar: "bg-sky-500",
    stat: "text-sky-600 dark:text-sky-400",
    chip: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    ring: "hover:border-sky-300 dark:hover:border-sky-800",
  },
  projections: {
    bar: "bg-violet-500",
    stat: "text-violet-600 dark:text-violet-400",
    chip: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    ring: "hover:border-violet-300 dark:hover:border-violet-800",
  },
  lineups: {
    bar: "bg-amber-500",
    stat: "text-amber-600 dark:text-amber-400",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    ring: "hover:border-amber-300 dark:hover:border-amber-800",
  },
  waivers: {
    bar: "bg-rose-500",
    stat: "text-rose-600 dark:text-rose-400",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    ring: "hover:border-rose-300 dark:hover:border-rose-800",
  },
  players: {
    bar: "bg-lime-500",
    stat: "text-lime-600 dark:text-lime-400",
    chip: "bg-lime-50 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
    ring: "hover:border-lime-300 dark:hover:border-lime-800",
  },
};

export default function MidseasonPage() {
  let n = 0;
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-amber-500 px-6 py-8 text-white shadow-sm sm:px-10 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-4 -top-6 select-none text-[9rem] leading-none opacity-20 sm:text-[12rem]"
        >
          🦕
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
          Weeks 1–{MIDSEASON_THROUGH_WEEK} · The Dig Site Report
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Midseason Fossil Record</h2>
        <p className="mt-2 max-w-xl text-sm text-white/90 sm:text-base">
          {SEASON_FACTS.length} facts unearthed from the first half of the season: the lucky, the
          cursed and the benched. Every number checked twice against ESPN.
        </p>
        <nav className="mt-5 flex flex-wrap gap-2">
          {FACT_CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur transition-colors hover:bg-white/30"
            >
              {c.emoji} {c.label}
            </a>
          ))}
        </nav>
      </div>

      {FACT_CATEGORIES.map((c) => {
        const facts = SEASON_FACTS.filter((f) => f.category === c.id);
        const accent = ACCENTS[c.id];
        return (
          <section key={c.id} id={c.id} className="mb-8 scroll-mt-20">
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-5 w-1.5 rounded-full ${accent.bar}`} />
              <h3 className="text-lg font-bold">
                {c.emoji} {c.label}
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {facts.map((f) => {
                n++;
                return (
                  <article
                    key={f.title}
                    className={`group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 ${accent.ring}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-bold tabular-nums text-neutral-400">
                        #{String(n).padStart(2, "0")}
                      </span>
                      <span
                        aria-hidden
                        className="text-3xl transition-transform duration-200 group-hover:rotate-12 group-hover:scale-110"
                      >
                        {f.emoji}
                      </span>
                    </div>
                    <h4 className="mt-1 text-sm font-bold uppercase tracking-wide text-neutral-500">
                      {f.title}
                    </h4>
                    <div className={`mt-2 text-4xl font-black tabular-nums ${accent.stat}`}>{f.stat}</div>
                    <div className="text-xs text-neutral-500">{f.statLabel}</div>
                    <span
                      className={`mt-3 self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${accent.chip}`}
                    >
                      {f.team}
                    </span>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {f.detail}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
