import { NextResponse } from "next/server";
import { AUTH_COOKIE, tokenForPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const configured = process.env.SITE_PASSWORD;

  if (!configured) {
    // No password configured at all — treat as open access.
    return NextResponse.json({ ok: true });
  }

  if (password !== configured) {
    return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, tokenForPassword(password), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
