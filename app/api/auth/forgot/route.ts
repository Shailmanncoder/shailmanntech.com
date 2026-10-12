import { NextResponse } from "next/server";
import { db } from "@/lib/admin/db";
import { issueCode, normaliseEmail } from "@/lib/portal/auth";
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

/** Emails a reset code if the account exists; the answer never says which. */
export const POST = portalRoute(async (request: Request) => {
  const email = normaliseEmail(str((await readBody(request)).email, 200));
  if (await limited(`forgot-ip:${ipOf(request)}`, 10, 3600)) return tooMany();
  if (await limited(`code-send:${email}`, 5, 3600)) return tooMany();
  const sql = await db();
  const [client] = await sql`select 1 from clients where email = ${email}`;
  if (client) await sendCode(email, await issueCode(email, "reset"), "reset");
  return NextResponse.json({ next: "reset", email });
});
