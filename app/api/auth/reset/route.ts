import { NextResponse } from "next/server";
import { db } from "@/lib/admin/db";
import {
  checkCode,
  endAllSessions,
  hashPassword,
  normaliseEmail,
  passwordProblem,
  startSession,
} from "@/lib/portal/auth";
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

/** Sets a new password with an emailed code; signs out every other device. */
export const POST = portalRoute(async (request: Request) => {
  const body = await readBody(request);
  const email = normaliseEmail(str(body.email, 200));
  const password = str(body.password, 300);
  if (await limited(`reset-ip:${ipOf(request)}`, 30, 3600)) return tooMany();
  const weak = passwordProblem(password);
  if (weak) return fail(weak);

  const result = await checkCode(email, "reset", str(body.code, 20));
  if (result === "wrong")
    return fail("That code isn't right. Check the email and try again.");
  if (result !== "ok") return fail("That code has expired. Send a new one.");

  const sql = await db();
  const [client] = await sql<{ id: string }[]>`
    update clients set password_hash = ${await hashPassword(password)},
      email_verified_at = coalesce(email_verified_at, now())
    where email = ${email} returning id`;
  if (!client) return fail("That code has expired. Send a new one.");
  await endAllSessions(String(client.id));
  await startSession(String(client.id));
  return NextResponse.json({ ok: true });
});
