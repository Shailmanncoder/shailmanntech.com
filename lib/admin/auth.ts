import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { clearHits, countHits, recordHit } from "@/lib/rate-limit";
import { adminDbConfigured, db } from "./db";

/**
 * Single-user admin login. The username and password live only in the
 * environment (ADMIN_USERNAME / ADMIN_PASSWORD) — never in this public repo.
 * A session is an HMAC-signed generation and expiry in an httpOnly cookie.
 */

export const SESSION_COOKIE = "smt_admin";
const SESSION_DAYS = 7;
const MAX_FAILURES = 5;
const LOCKOUT_MINUTES = 15;

export function adminConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

function signingKey() {
  const secret =
    process.env.ADMIN_SESSION_SECRET ??
    `${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`;
  return createHash("sha256").update(`smt-admin-session:${secret}`).digest();
}

function sign(value: string) {
  return createHmac("sha256", signingKey()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  // Hash first so the comparison never leaks the length of the secret.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function credentialsMatch(username: string, password: string) {
  if (!adminConfigured()) return false;
  const userOk = safeEqual(username, process.env.ADMIN_USERNAME!);
  const passOk = safeEqual(password, process.env.ADMIN_PASSWORD!);
  return userOk && passOk;
}

/*
 * A session cookie is "<generation>.<expiry>.<signature>". The generation is
 * a counter stored in the database; "Sign out all devices" bumps it, which
 * instantly invalidates every cookie issued before.
 */

const GENERATION_KEY = "session_generation";
const GENERATION_CACHE_MS = 10_000;
const globalForSessions = globalThis as unknown as {
  sessionGeneration?: { value: number; at: number };
};

/** The current session generation (always 0 without a database). */
export async function currentSessionGeneration() {
  if (!adminDbConfigured()) return 0;
  const cached = globalForSessions.sessionGeneration;
  if (cached && Date.now() - cached.at < GENERATION_CACHE_MS)
    return cached.value;
  const sql = await db();
  const [row] = await sql<{ value: number }[]>`
    select value from admin_settings where key = ${GENERATION_KEY}`;
  const value = row ? Number(row.value) : 0;
  globalForSessions.sessionGeneration = { value, at: Date.now() };
  return value;
}

/** Ends every existing session, including the caller's. */
export async function revokeAllSessions() {
  if (!adminDbConfigured()) {
    throw new Error(
      "Signing out other devices needs the database (DATABASE_URL).",
    );
  }
  const sql = await db();
  const [row] = await sql<{ value: number }[]>`
    insert into admin_settings (key, value, updated_at)
    values (${GENERATION_KEY}, '1'::jsonb, now())
    on conflict (key) do update
      set value = to_jsonb((admin_settings.value)::text::int + 1), updated_at = now()
    returning value`;
  globalForSessions.sessionGeneration = {
    value: Number(row.value),
    at: Date.now(),
  };
}

export async function createSessionValue() {
  const generation = await currentSessionGeneration();
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${generation}.${expires}`;
  return { value: `${payload}.${sign(payload)}`, expires };
}

/** Checks the signature and expiry; returns the session's generation. */
export function parseSession(value: string | undefined) {
  if (!value || !adminConfigured()) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [generation, expires, signature] = parts;
  if (!/^\d+$/.test(generation) || !/^\d+$/.test(expires)) return null;
  if (!safeEqual(signature, sign(`${generation}.${expires}`))) return null;
  if (Number(expires) <= Date.now()) return null;
  return { generation: Number(generation), expires: Number(expires) };
}

export async function sessionActive(value: string | undefined) {
  const session = parseSession(value);
  if (!session) return false;
  return session.generation === (await currentSessionGeneration());
}

export async function isAdmin() {
  const store = await cookies();
  return sessionActive(store.get(SESSION_COOKIE)?.value);
}

/** For API routes: returns a 401 response when the caller isn't signed in. */
export async function rejectUnlessAdmin() {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "Not signed in." }, { status: 401 });
}

export async function clientIp() {
  const list = await headers();
  return (
    list.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    list.get("x-real-ip") ||
    "unknown"
  );
}

/*
 * Brute-force protection: 5 failed attempts per IP locks it out for 15 min.
 * Counts live in Postgres when it's configured and in memory otherwise, so the
 * lockout never switches off.
 */

const failureKey = (ip: string) => `admin-login:${ip}`;

export async function lockedOut(ip: string) {
  return (
    (await countHits(failureKey(ip), LOCKOUT_MINUTES * 60)) >= MAX_FAILURES
  );
}

export async function recordFailure(ip: string) {
  await recordHit(failureKey(ip));
}

export async function clearFailures(ip: string) {
  await clearHits(failureKey(ip));
}
