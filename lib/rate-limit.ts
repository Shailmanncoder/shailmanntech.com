import "server-only";
import { adminDbConfigured, db } from "@/lib/admin/db";

/**
 * Counts events per key inside a sliding time window. Uses Postgres when
 * DATABASE_URL is set, so limits hold across every server instance; without
 * it, falls back to this instance's memory, which still stops a burst.
 */

const memory = new Map<string, number[]>();

function memoryHits(key: string, windowSeconds: number) {
  const since = Date.now() - windowSeconds * 1000;
  const hits = (memory.get(key) ?? []).filter((at) => at > since);
  memory.set(key, hits);
  return hits;
}

function recordInMemory(key: string) {
  const hits = memory.get(key) ?? [];
  hits.push(Date.now());
  memory.set(key, hits);
}

// A database outage must not take the contact form or login down with it, so
// failures fall back to this instance's memory rather than throwing.

export async function countHits(key: string, windowSeconds: number) {
  if (!adminDbConfigured()) return memoryHits(key, windowSeconds).length;
  try {
    const sql = await db();
    const [row] = await sql<{ count: number }[]>`
      select count(*)::int as count from rate_limit_hits
      where key = ${key} and at > now() - make_interval(secs => ${windowSeconds})`;
    return Math.max(row.count, memoryHits(key, windowSeconds).length);
  } catch (error) {
    console.error("Rate limit lookup failed; using memory:", error);
    return memoryHits(key, windowSeconds).length;
  }
}

export async function recordHit(key: string) {
  recordInMemory(key);
  if (!adminDbConfigured()) return;
  try {
    const sql = await db();
    await sql`insert into rate_limit_hits (key) values (${key})`;
    // Housekeeping: nothing here needs to be kept longer than a day.
    if (Math.random() < 0.05) {
      await sql`delete from rate_limit_hits where at < now() - interval '1 day'`;
    }
  } catch (error) {
    console.error("Rate limit write failed; counted in memory only:", error);
  }
}

export async function clearHits(key: string) {
  memory.delete(key);
  if (!adminDbConfigured()) return;
  try {
    const sql = await db();
    await sql`delete from rate_limit_hits where key = ${key}`;
  } catch (error) {
    console.error("Rate limit reset failed:", error);
  }
}

/** Records one event and reports whether the key is still within its limit. */
export async function allow(key: string, limit: number, windowSeconds: number) {
  if ((await countHits(key, windowSeconds)) >= limit) return false;
  await recordHit(key);
  return true;
}

/** Test hook: forget in-memory counts. */
export function resetMemoryLimits() {
  memory.clear();
}
