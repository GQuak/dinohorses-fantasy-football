import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE = "ff_auth";

function secret(): string {
  // Falls back to a fixed (weak) dev-only value so `npm run dev` works
  // without any env vars set. Production deploys should always set
  // AUTH_SECRET (and SITE_PASSWORD) explicitly — see README.
  return process.env.AUTH_SECRET || "dev-only-insecure-secret";
}

/** Deterministic token proving the caller knows SITE_PASSWORD, without
 * storing the password itself in the cookie. */
export function tokenForPassword(password: string): string {
  return createHmac("sha256", secret()).update(password).digest("hex");
}

export function expectedToken(): string | null {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;
  return tokenForPassword(password);
}

export function isValidToken(token: string | undefined | null): boolean {
  const expected = expectedToken();
  // No password configured -> site is intentionally open (e.g. local dev).
  if (!expected) return true;
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
