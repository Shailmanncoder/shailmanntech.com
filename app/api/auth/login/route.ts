import { NextResponse } from "next/server";
import { db } from "@/lib/admin/db";
import { clearHits, countHits, recordHit } from "@/lib/rate-limit";
import {
  issueCode,
  normaliseEmail,
  startSession,
  verifyPassword,
} from "@/lib/portal/auth";
import { sendCode } from "@/lib/portal/email";
import { fail, ipOf, portalRoute, readBody, str } from "@/lib/portal/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FAILURES = 5;
const WINDOW = 15 * 60;

export const POST = portalRoute(async (request: Request) => {
  const body = await readBody(request);
  const email = normaliseEmail(str(body.email, 200));
  const password = str(body.password, 300);
  const keys = [`login-ip:${ipOf(request)}`, `login-email:${email}`];

  for (const key of keys) {
    if (
      (await countHits(key, WINDOW)) >=
      MAX_FAILURES * (key.startsWith("login-ip") ? 4 : 1)
    ) {
      return fail(
        "Too many attempts. Please wait 15 minutes, or reset your password.",
        429,
      );
    }
  }

  const sql = await db();
  const [client] = await sql<
    { id: string; password_hash: string | null; verified: boolean }[]
  >`
    select id, password_hash, email_verified_at is not null as verified
    from clients where email = ${email}`;
  const valid = await verifyPassword(password, client?.password_hash ?? null);
  if (!client || !valid) {
    for (const key of keys) await recordHit(key);
    return fail(
      client && !client.password_hash
        ? "This account uses Google. Continue with Google, or use “Forgot password” to add a password."
        : "Wrong email or password.",
      401,
    );
  }
  for (const key of keys) await clearHits(key);

  if (!client.verified) {
    await sendCode(email, await issueCode(email, "verify"), "verify");
    return NextResponse.json({ next: "verify", email });
  }
  await startSession(String(client.id));
  return NextResponse.json({ ok: true });
});
