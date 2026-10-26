import "server-only";
import {
  createHash,
  randomBytes,
  randomInt,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/admin/db";

/**
 * Client accounts for the portal: email + password (verified with an emailed
 * code) or Google. Passwords are hashed with scrypt; codes and session tokens
 * are random and only their SHA-256 hashes are stored.
 */

export const CLIENT_COOKIE = "smt_client";
const SESSION_DAYS = 30;
export const CODE_MINUTES = 10;
export const CODE_ATTEMPTS = 5;
export const MIN_PASSWORD = 10;

const scrypt = (
  password: string,
  salt: Buffer,
  length: number,
  options: ScryptOptions,
) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCallback(password, salt, length, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string | null) {
  // Always do the work, so a missing account takes as long as a wrong password.
  const [scheme, n, r, p, salt, hash] = (stored ?? "").split("$");
  const valid = scheme === "scrypt" && salt && hash;
  const expected = valid ? Buffer.from(hash, "base64") : Buffer.alloc(64);
  const key = await scrypt(
    password,
    valid ? Buffer.from(salt, "base64") : Buffer.alloc(16),
    expected.length,
    valid
      ? { N: Number(n), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem }
      : SCRYPT,
  );
  return Boolean(valid) && timingSafeEqual(key, expected);
}

export function passwordProblem(password: string) {
  if (password.length < MIN_PASSWORD) {
    return `Use at least ${MIN_PASSWORD} characters.`;
  }
  if (password.length > 200) return "That password is too long.";
  return null;
}

const sha256 = (text: string) =>
  createHash("sha256").update(text).digest("hex");

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

/* ------------------------------------------------------------------ */
/*  One-time codes                                                     */
/* ------------------------------------------------------------------ */

export type CodePurpose = "verify" | "reset";

/** Creates a 6-digit code (replacing any earlier one) and returns it. */
export async function issueCode(email: string, purpose: CodePurpose) {
  const sql = await db();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await sql`
    update client_codes set used_at = now()
    where email = ${email} and purpose = ${purpose} and used_at is null`;
  await sql`
    insert into client_codes (email, purpose, code_hash, expires_at)
    values (${email}, ${purpose}, ${sha256(`${email}:${code}`)},
            now() + make_interval(mins => ${CODE_MINUTES}))`;
  return code;
}

export type CodeCheck = "ok" | "wrong" | "expired" | "too_many";

/** Checks a code; it can be used once, and only within its attempts. */
export async function checkCode(
  email: string,
  purpose: CodePurpose,
  code: string,
): Promise<CodeCheck> {
  const sql = await db();
  const [row] = await sql<
    { id: string; code_hash: string; attempts: number; expired: boolean }[]
  >`
    select id, code_hash, attempts, expires_at < now() as expired
    from client_codes
    where email = ${email} and purpose = ${purpose} and used_at is null
    order by created_at desc limit 1`;
  if (!row || row.expired) return "expired";
  if (row.attempts >= CODE_ATTEMPTS) return "too_many";

  const given = Buffer.from(sha256(`${email}:${code.trim()}`));
  const stored = Buffer.from(row.code_hash);
  if (!/^\d{6}$/.test(code.trim()) || !timingSafeEqual(given, stored)) {
    await sql`update client_codes set attempts = attempts + 1 where id = ${row.id}`;
    return row.attempts + 1 >= CODE_ATTEMPTS ? "too_many" : "wrong";
  }
  await sql`update client_codes set used_at = now() where id = ${row.id}`;
  return "ok";
}

/* ------------------------------------------------------------------ */
/*  Sessions                                                           */
/* ------------------------------------------------------------------ */

export type Client = {
  id: string;
  email: string;
  name: string;
  hasPassword: boolean;
  hasGoogle: boolean;
};

export async function startSession(clientId: string) {
  const sql = await db();
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await sql`
    insert into client_sessions (token_hash, client_id, expires_at)
    values (${sha256(token)}, ${clientId}, ${expires})`;
  await sql`update clients set last_login_at = now() where id = ${clientId}`;
  const store = await cookies();
  store.set(CLIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // "lax" so the Google sign-in redirect keeps the session
    path: "/",
    expires,
  });
}

export async function clientFromToken(
  token: string | undefined,
): Promise<Client | null> {
  if (!token) return null;
  const sql = await db();
  const [row] = await sql<
    {
      id: string;
      email: string;
      name: string;
      password_hash: string | null;
      google_sub: string | null;
    }[]
  >`
    select c.id, c.email, c.name, c.password_hash, c.google_sub
    from client_sessions s join clients c on c.id = s.client_id
    where s.token_hash = ${sha256(token)} and s.revoked_at is null
      and s.expires_at > now() and c.email_verified_at is not null
      and not is_blocked_sender(c.email)`;
  if (!row) return null;
  return {
    id: String(row.id),
    email: row.email,
    name: row.name,
    hasPassword: Boolean(row.password_hash),
    hasGoogle: Boolean(row.google_sub),
  };
}

/** The signed-in client, or null. */
export async function currentClient() {
  const store = await cookies();
  return clientFromToken(store.get(CLIENT_COOKIE)?.value).catch(() => null);
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE)?.value;
  if (token) {
    const sql = await db();
    await sql`update client_sessions set revoked_at = now() where token_hash = ${sha256(token)}`;
  }
  store.delete(CLIENT_COOKIE);
}

/** Signs the client out everywhere, e.g. after a password reset. */
export async function endAllSessions(clientId: string) {
  const sql = await db();
  await sql`
    update client_sessions set revoked_at = now()
    where client_id = ${clientId} and revoked_at is null`;
}
