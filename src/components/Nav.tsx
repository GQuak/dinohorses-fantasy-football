"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/matchups", label: "Matchups" },
  { href: "/recap", label: "Weekly Recap" },
  { href: "/teams", label: "Teams" },
  { href: "/compare", label: "Compare" },
  { href: "/trade", label: "Trade" },
  { href: "/standings", label: "Standings" },
  { href: "/awards", label: "Awards" },
  { href: "/rankings", label: "Player Rankings" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <span className="text-sm font-semibold tracking-tight">
          🏈 {process.env.NEXT_PUBLIC_SITE_NAME || "Fantasy Football Dashboard"}
        </span>
        <nav className="flex flex-1 flex-wrap gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
