import "server-only";
import { adminDbConfigured, db } from "@/lib/admin/db";

/**
 * Records a failure that someone should look at: always to the server log,
 * and to the app_errors table (shown on the admin's System page) when the
 * database is available. Never throws, so reporting can't cause new failures.
 */

export type ErrorSource =
  | "admin-api"
  | "ai"
  | "config"
  | "contact-delivery"
  | "contact-confirmation"
  | "mailbox-sync"
  | "reply-send";

function describe(error: unknown) {
  if (error instanceof Error)
    return { message: error.message, name: error.name };
  if (typeof error === "string") return { message: error };
  return { message: "Unknown error", value: String(error) };
}

export async function reportError(
  source: ErrorSource,
  error: unknown,
  context: Record<string, unknown> = {},
) {
  const { message, ...rest } = describe(error);
  console.error(`[${source}] ${message}`, context);
  if (!adminDbConfigured()) return;
  try {
    const sql = await db();
    const details = JSON.parse(JSON.stringify({ ...rest, ...context }));
    await sql`
      insert into app_errors (source, message, details)
      values (${source}, ${message.slice(0, 2000)}, ${sql.json(details)})`;
  } catch (failure) {
    console.error("Couldn't record the error above:", failure);
  }
}

export type AppError = {
  id: string;
  at: string;
  source: string;
  message: string;
  details: Record<string, unknown>;
};

export async function listErrors(limit = 50): Promise<AppError[]> {
  const sql = await db();
  const rows = await sql<
    {
      id: string;
      at: Date;
      source: string;
      message: string;
      details: Record<string, unknown>;
    }[]
  >`
    select id, at, source, message, details from app_errors
    where not resolved order by at desc limit ${limit}`;
  return rows.map((row) => ({
    ...row,
    id: String(row.id),
    at: row.at.toISOString(),
  }));
}

export async function countOpenErrors() {
  const sql = await db();
  const [row] = await sql<{ count: number }[]>`
    select count(*)::int as count from app_errors where not resolved`;
  return row.count;
}

export async function resolveErrors(ids: string[] | "all") {
  const sql = await db();
  if (ids === "all") {
    await sql`update app_errors set resolved = true where not resolved`;
  } else if (ids.length) {
    await sql`update app_errors set resolved = true where id = any(${ids}::bigint[])`;
  }
}
