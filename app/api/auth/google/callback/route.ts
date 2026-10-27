import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isBlockedSender } from "@/lib/admin/blocked";
import { adminDbConfigured, db } from "@/lib/admin/db";
import { reportError } from "@/lib/errors";
import { startSession } from "@/lib/portal/auth";
import { announceSignup } from "@/lib/portal/signup";
import { finishGoogleSignIn, GOOGLE_STATE_COOKIE } from "@/lib/portal/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Google sends the visitor back here; finish sign-in and open the dashboard. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (error?: string) => {
    const response = NextResponse.redirect(
      `${url.origin}${error ? `/login?error=${error}` : "/dashboard"}`,
    );
    // The sign-in state is single-use.
    response.cookies.set(GOOGLE_STATE_COOKIE, "", {
      path: "/api/auth/google",
      maxAge: 0,
    });
    return response;
  };

  const store = await cookies();
  const saved = store.get(GOOGLE_STATE_COOKIE)?.value ?? "";
  const [state, verifier] = saved.split(".");
  const code = url.searchParams.get("code");
  if (url.searchParams.get("error")) return back("google_cancelled");
  if (
    !code ||
    !state ||
    !verifier ||
    !same(state, url.searchParams.get("state") ?? "")
  ) {
    return back("google_failed");
  }
  if (!adminDbConfigured()) return back("unavailable");

  try {
    const profile = await finishGoogleSignIn(url.origin, code, verifier);
    if (await isBlockedSender(profile.email)) return back("google_failed");
    const sql = await db();
    // Same Google account, or an existing account with that (Google-verified)
    // email: link them. Otherwise create a new, already-verified account.
    const [before] = await sql<{ verified: boolean }[]>`
      select email_verified_at is not null as verified from clients where email = ${profile.email}`;
    const [client] = await sql<{ id: string }[]>`
      insert into clients (email, name, google_sub, email_verified_at)
      values (${profile.email}, ${profile.name}, ${profile.sub}, now())
      on conflict (email) do update set
        google_sub = excluded.google_sub,
        -- A password set on a never-verified account wasn't proven to belong
        -- to this person, so Google verifying the address removes it.
        password_hash = case when clients.email_verified_at is null then null
                             else clients.password_hash end,
        name = case when clients.name = '' then excluded.name else clients.name end,
        email_verified_at = coalesce(clients.email_verified_at, now())
      returning id`;
    await startSession(String(client.id));
    if (!before?.verified) await announceSignup(profile.email, profile.name, "Google");
    return back();
  } catch (error) {
    await reportError("admin-api", error, { area: "Google sign-in" });
    return back("google_failed");
  }
}
