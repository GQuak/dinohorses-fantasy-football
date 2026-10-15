"use client";

import { useState } from "react";

export default function PlayerAvatar({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className="h-9 w-9 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800"
        aria-hidden
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- small decorative
  // avatar from ESPN's CDN; not worth routing through next/image's
  // optimizer config for a 36px icon.
  return (
    <img
      src={src}
      alt={alt}
      className="h-9 w-9 shrink-0 rounded-full bg-neutral-100 object-cover dark:bg-neutral-800"
      onError={() => setErrored(true)}
    />
  );
}
