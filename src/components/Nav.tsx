"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Pages grouped into menus. A group with one page is a plain link that
// goes straight to it.
const GROUPS = [
  {
    label: "Insights",
    links: [
      { href: "/recap", label: "Weekly Recap" },
      { href: "/awards", label: "Awards" },
      { href: "/midseason", label: "Midseason" },
    ],
  },
  {
    label: "Current Week",
    links: [{ href: "/matchups", label: "Matchups" }],
  },
  {
    label: "Season",
    links: [
      { href: "/teams", label: "Teams" },
      { href: "/standings", label: "Standings" },
      { href: "/rankings", label: "Player Rankings" },
    ],
  },
  {
    label: "Trade Tools",
    links: [
      { href: "/compare", label: "Compare" },
      { href: "/trade", label: "Trade" },
    ],
  },
];

const itemClass = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
  }`;

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Close the open menu on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <span className="text-sm font-semibold tracking-tight">
          🏈 {process.env.NEXT_PUBLIC_SITE_NAME || "Fantasy Football Dashboard"}
        </span>
        <nav ref={navRef} className="flex flex-1 flex-wrap gap-1">
          {GROUPS.map((group) => {
            const active = group.links.some((l) => isActive(l.href));
            if (group.links.length === 1) {
              return (
                <Link key={group.label} href={group.links[0].href} className={itemClass(active)}>
                  {group.label}
                </Link>
              );
            }
            const isOpen = open === group.label;
            return (
              <div key={group.label} className="relative">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  onClick={() => setOpen(isOpen ? null : group.label)}
                  className={`inline-flex items-center gap-1 ${itemClass(active)}`}
                >
                  {group.label}
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="currentColor"
                  >
                    <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
                  </svg>
                </button>
                {isOpen && (
                  <div
                    role="menu"
                    className="absolute left-0 top-full z-30 mt-1 min-w-44 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        onClick={() => setOpen(null)}
                        className={`block ${itemClass(isActive(link.href))}`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
