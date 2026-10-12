import { NextResponse } from "next/server";
import { db } from "@/lib/admin/db";
import { checkCode, normaliseEmail, startSession } from "@/lib/portal/auth";
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
  const [client] = await sql<{ id: string }[]>`
    update clients set email_verified_at = coalesce(email_verified_at, now())
    where email = ${email} returning id`;
  if (!client) return fail(MESSAGES.expired);
  await startSession(String(client.id));
  return NextResponse.json({ ok: true });
});
