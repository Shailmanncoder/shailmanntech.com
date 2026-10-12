import { NextResponse } from "next/server";
import { db } from "@/lib/admin/db";
import { issueCode, normaliseEmail, type CodePurpose } from "@/lib/portal/auth";
import { sendCode } from "@/lib/portal/email";
import {
  ipOf,
  limited,
  portalRoute,
  readBody,
  str,
  tooMany,
} from "@/lib/portal/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sends a fresh code. Always answers the same way, whether or not the account exists. */
export const POST = portalRoute(async (request: Request) => {
  const body = await readBody(request);
  const email = normaliseEmail(str(body.email, 200));
  const purpose: CodePurpose = body.purpose === "reset" ? "reset" : "verify";
  if (await limited(`resend-ip:${ipOf(request)}`, 20, 3600)) return tooMany();
  if (await limited(`code-send:${email}`, 5, 3600)) return tooMany();

  const sql = await db();
  const [client] = await sql<{ verified: boolean }[]>`
    select email_verified_at is not null as verified from clients where email = ${email}`;
  if (client && (purpose === "reset" || !client.verified)) {
    await sendCode(email, await issueCode(email, purpose), purpose);
  }
  return NextResponse.json({ ok: true });
});
