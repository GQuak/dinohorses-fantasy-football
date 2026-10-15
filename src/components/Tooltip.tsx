"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

// Custom tooltip instead of the native `title` attribute: title tooltips
// don't appear at all on touch devices (no hover state), have
// inconsistent timing/styling across browsers, and are easy to miss.
// Works on hover (desktop, via mouseenter/mouseleave) and tap (mobile,
// via onClick). onClick deliberately only ever *opens* rather than
// toggling: a real mouse click fires mouseenter (opening it) followed
// immediately by click, so a toggle there would instantly close it
// again on every single click -- this way that's idempotent instead.
export default function Tooltip({
  label,
  children,
  className = "",
  style,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`relative flex flex-col items-center ${className}`}
      style={style}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(true)}
    >
      {children}
      <div
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-md bg-neutral-900 px-2 py-1 text-center text-[11px] font-medium text-white shadow-lg transition-opacity duration-100 dark:bg-neutral-100 dark:text-neutral-900 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
