import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  adminConfigured,
  clearFailures,
  clientIp,
  createSessionValue,
  credentialsMatch,
  lockedOut,
  recordFailure,
} from "@/lib/admin/auth";
import { readJson, text } from "@/lib/admin/api";
import { logEvent } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin sign-in isn't set up yet (ADMIN_USERNAME / ADMIN_PASSWORD).",
      },
      { status: 503 },
    );
  }

  const ip = await clientIp();
  if (await lockedOut(ip)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  const body = await readJson(request);
  const username = text(body.username, 200).trim();
  const password = text(body.password, 500);

  if (!credentialsMatch(username, password)) {
    await recordFailure(ip);
    await logEvent("login_failed", { ip, details: { username } });
    // A short pause slows down guessing without bothering a real person.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json(
      { error: "Wrong username or password." },
      { status: 401 },
    );
  }

  await clearFailures(ip);
  await logEvent("login", { ip });
  const session = await createSessionValue();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(session.expires),
  });
  return response;
}
