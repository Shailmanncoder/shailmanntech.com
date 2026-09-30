import "server-only";
import { clientIp } from "./auth";
import { adminDbConfigured, db } from "./db";

/**
 * The admin activity log. Each entry says what happened, to what, and from
 * which IP. Logging never blocks or fails the action it describes.
 */

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "sessions_revoked"
  | "reply_sent"
  | "message_updated"
  | "rules_saved"
  | "lead_saved"
  | "export_downloaded"
  | "mail_synced"
  | "errors_resolved";

export async function logEvent(
  action: AuditAction,
  options: {
    target?: string;
    details?: Record<string, unknown>;
    ip?: string;
  } = {},
) {
  if (!adminDbConfigured()) return;
  try {
    const ip = options.ip ?? (await clientIp().catch(() => undefined));
    const sql = await db();
    await sql`
      insert into admin_events (action, target, details, ip)
      values (${action}, ${options.target ?? null}, ${sql.json(
        JSON.parse(JSON.stringify(options.details ?? {})),
      )}, ${ip ?? null})`;
  } catch (error) {
    console.error(`Couldn't record the "${action}" activity entry:`, error);
  }
}

export type AuditEvent = {
  id: string;
  at: string;
  action: AuditAction;
  target: string | null;
  details: Record<string, unknown>;
  ip: string | null;
};

export async function listEvents(limit = 100): Promise<AuditEvent[]> {
  const sql = await db();
  const rows = await sql<
    {
      id: string;
      at: Date;
      action: AuditAction;
      target: string | null;
      details: Record<string, unknown>;
      ip: string | null;
    }[]
  >`select id, at, action, target, details, ip from admin_events order by at desc limit ${limit}`;
  return rows.map((row) => ({
    ...row,
    id: String(row.id),
    at: row.at.toISOString(),
  }));
}
