import { NextResponse } from "next/server";
import { db } from "@/lib/admin/db";
import { checkCode, normaliseEmail, startSession } from "@/lib/portal/auth";
import { announceSignup } from "@/lib/portal/signup";
import {
  fail,
  ipOf,
  limited,
  portalRoute,
  readBody,
  str,
  tooMany,
} from "@/lib/portal/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MESSAGES = {
  wrong: "That code isn't right. Check the email and try again.",
  expired: "That code has expired. Send a new one.",
  too_many: "Too many wrong codes. Send a new one.",
} as const;

/** Confirms the email address with the emailed code and signs the client in. */
export const POST = portalRoute(async (request: Request) => {
  const body = await readBody(request);
  const email = normaliseEmail(str(body.email, 200));
  if (await limited(`verify-ip:${ipOf(request)}`, 30, 3600)) return tooMany();

  const result = await checkCode(email, "verify", str(body.code, 20));
  if (result !== "ok") return fail(MESSAGES[result], 400);

  const sql = await db();
  const [client] = await sql<{ id: string; name: string; was_new: boolean }[]>`
    update clients c set email_verified_at = coalesce(c.email_verified_at, now())
    from (select id, email_verified_at is null as was_new from clients where email = ${email}) before
    where c.id = before.id
    returning c.id, c.name, before.was_new`;
  if (!client) return fail(MESSAGES.expired);
  await startSession(String(client.id));
  if (client.was_new) await announceSignup(email, client.name, "email and password");
  return NextResponse.json({ ok: true });
});

