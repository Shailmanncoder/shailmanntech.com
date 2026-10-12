import { NextResponse } from "next/server";
import { db } from "@/lib/admin/db";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  hashPassword,
  issueCode,
  normaliseEmail,
  passwordProblem,
} from "@/lib/portal/auth";
import { sendCode } from "@/lib/portal/email";
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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Creates an unverified account and emails a 6-digit code. */
export const POST = portalRoute(async (request: Request) => {
  const body = await readBody(request);
  const name = str(body.name, 120).trim();
  const email = normaliseEmail(str(body.email, 200));
  const password = str(body.password, 300);
  const ip = ipOf(request);

  if (await limited(`signup-ip:${ip}`, 10, 3600)) return tooMany();
  if (name.length < 2) return fail("Please enter your name.");
  if (!EMAIL.test(email)) return fail("Please enter a valid email address.");
  const weak = passwordProblem(password);
  if (weak) return fail(weak);
  if (
    !(await verifyTurnstile(
      str(body.turnstileToken, 4000),
      ip === "unknown" ? null : ip,
    ))
  ) {
    return fail("We couldn't confirm you're a person. Please try again.", 403);
  }
  if (await limited(`code-send:${email}`, 5, 3600)) return tooMany();

  const sql = await db();
  const [existing] = await sql<{ verified: boolean }[]>`
    select email_verified_at is not null as verified from clients where email = ${email}`;
  if (existing?.verified) {
    return fail(
      "You already have an account. Log in, or use “Forgot password”.",
      409,
    );
  }

  const passwordHash = await hashPassword(password);
  await sql`
    insert into clients (email, name, password_hash) values (${email}, ${name}, ${passwordHash})
    on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash
    where clients.email_verified_at is null`;
  await sendCode(email, await issueCode(email, "verify"), "verify");
  return NextResponse.json({ next: "verify", email });
});
