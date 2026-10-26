import "server-only";
import { checkPattern } from "@/lib/blocklist";
import { inboxAddress, senderAddress } from "@/lib/contact-delivery";
import { reportError } from "@/lib/errors";
import { site } from "@/lib/site";
import { adminDbConfigured, db } from "./db";

/**
 * Blocked senders. Their mail is still imported but filed in Blocked, away
 * from the inbox, stats, AI and alerts; they can't send the contact form or
 * use the client portal. They aren't told.
 */

export type BlockedSender = {
  id: string;
  pattern: string;
  note: string;
  createdAt: string;
  /** Emails filed as blocked because of this entry. */
  messages: number;
};

const ownAddresses = () => [site.email, inboxAddress(), senderAddress()];

export async function listBlocked(): Promise<BlockedSender[]> {
  const sql = await db();
  const rows = await sql<
    { id: string; pattern: string; note: string; created_at: Date; messages: number }[]
  >`
    select b.id, b.pattern, b.note, b.created_at,
      (select count(*)::int from admin_messages m
       where m.blocked and (lower(m.contact_email) = b.pattern
          or (position('@' in b.pattern) = 0 and (
                lower(m.contact_email) like '%@' || b.pattern
             or lower(m.contact_email) like '%.' || b.pattern)))) as messages
    from blocked_senders b order by b.created_at desc`;
  return rows.map((r) => ({
    id: String(r.id),
    pattern: r.pattern,
    note: r.note,
    createdAt: r.created_at.toISOString(),
    messages: r.messages,
  }));
}

export type BlockResult =
  | { ok: true; pattern: string; messages: number }
  | { ok: false; error: string };

export async function blockSender(input: string, note = ""): Promise<BlockResult> {
  const checked = checkPattern(input, ownAddresses());
  if (!checked.ok) return checked;
  const sql = await db();
  return sql.begin(async (tx) => {
    await tx`
      insert into blocked_senders (pattern, note) values (${checked.pattern}, ${note.slice(0, 300)})
      on conflict (pattern) do nothing`;
    const filed = await tx`
      update admin_messages set blocked = true
      where not blocked and is_blocked_sender(contact_email)`;
    // Sign them out of the client portal everywhere.
    await tx`
      update client_sessions set revoked_at = now()
      where revoked_at is null
        and client_id in (select id from clients where is_blocked_sender(email))`;
    return { ok: true as const, pattern: checked.pattern, messages: filed.count };
  });
}

/**
 * Removes one entry (by id), or every entry covering an address (by email).
 * Mail no longer covered goes back to the inbox.
 */
export async function unblockSender(by: { id: string } | { email: string }) {
  const sql = await db();
  return sql.begin(async (tx) => {
    const removed = await tx<{ pattern: string }[]>`
      delete from blocked_senders b
      where ${
        "id" in by
          ? tx`b.id = ${by.id}`
          : tx`b.pattern = lower(trim(${by.email}))
               or (position('@' in b.pattern) = 0 and (
                     right(lower(trim(${by.email})), length(b.pattern) + 1) = '@' || b.pattern
                  or right(lower(trim(${by.email})), length(b.pattern) + 1) = '.' || b.pattern))`
      }
      returning pattern`;
    if (!removed.length) return null;
    const restored = await tx`
      update admin_messages set blocked = false
      where blocked and not is_blocked_sender(contact_email)`;
    return {
      pattern: removed.map((r) => r.pattern).join(", "),
      messages: restored.count,
    };
  });
}

/**
 * Whether an address is blocked. If the check itself fails the sender is let
 * through: a database hiccup shouldn't turn real clients away.
 */
export async function isBlockedSender(email: string) {
  if (!email || !adminDbConfigured()) return false;
  try {
    const sql = await db();
    const [row] = await sql<{ blocked: boolean }[]>`
      select is_blocked_sender(${email}) as blocked`;
    return Boolean(row?.blocked);
  } catch (error) {
    await reportError("admin-api", error, { area: "blocked sender check" });
    return false;
  }
}
