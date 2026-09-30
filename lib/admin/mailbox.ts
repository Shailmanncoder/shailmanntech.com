import "server-only";
import { ImapFlow } from "imapflow";
import { simpleParser, type AddressObject } from "mailparser";
import { senderAddress } from "@/lib/contact-delivery";
import { automatedReason } from "./automated";
import { site } from "@/lib/site";
import { db } from "./db";

/**
 * Copies the support@ inbox into Postgres over IMAP. The mailbox is opened
 * read-only, so syncing never marks mail as read or changes anything there.
 *
 * Each call imports one batch and reports how many remain, so a first sync of
 * a large inbox runs as several short requests instead of one long one.
 */

const MAILBOX = "INBOX";
const BATCH_SIZE = 25;
const FIRST_SYNC_DAYS = 365;
const MAX_BODY = 100_000;
const CLASSIFY_BATCH = 150;

export function mailboxConfigured() {
  return Boolean(process.env.IMAP_USER && process.env.IMAP_PASSWORD);
}

/**
 * Values pasted into Vercel often carry stray spaces, line breaks or quote
 * marks; the mail server would reject them as a wrong password.
 */
function cleanSetting(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  const unquoted = trimmed.match(/^(["'])([\s\S]*)\1$/)?.[2] ?? trimmed;
  return unquoted.trim();
}

function imapClient(loginMethod?: string) {
  return new ImapFlow({
    host: cleanSetting(process.env.IMAP_HOST) || "imap.secureserver.net",
    port: Number(process.env.IMAP_PORT ?? 993),
    secure: process.env.IMAP_SECURE !== "false",
    auth: {
      user: cleanSetting(process.env.IMAP_USER),
      pass: cleanSetting(process.env.IMAP_PASSWORD),
      loginMethod,
    },
    logger: false,
    tls:
      process.env.IMAP_ALLOW_SELF_SIGNED === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });
}

/** What was sent, without revealing the password itself. */
function describeSettings() {
  const raw = process.env.IMAP_PASSWORD ?? "";
  const user = cleanSetting(process.env.IMAP_USER);
  return {
    host:
      cleanSetting(process.env.IMAP_HOST) || "imap.secureserver.net (default)",
    user: user.replace(/^(.).*(@.*)$/, "$1***$2"),
    passwordLength: cleanSetting(raw).length,
    passwordHadExtraSpaces: raw !== raw.trim(),
    passwordHadQuotes: /^\s*["']/.test(raw),
  };
}

/**
 * Signs in with AUTH=PLAIN (what the server advertises) and, if refused,
 * once more with the plain LOGIN command, which some hosts treat differently.
 */
export async function connect() {
  let lastError: unknown;
  for (const method of [undefined, "LOGIN"]) {
    const client = imapClient(method);
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      if (!(error as { authenticationFailed?: boolean }).authenticationFailed) {
        throw error;
      }
    }
  }
  console.error("Mailbox sign-in refused. Settings used:", describeSettings());
  throw lastError;
}

function firstAddress(field: AddressObject | AddressObject[] | undefined) {
  const list = Array.isArray(field) ? field : field ? [field] : [];
  const entry = list.flatMap((item) => item.value)[0];
  return {
    name: entry?.name ?? "",
    email: (entry?.address ?? "").toLowerCase(),
  };
}

/**
 * Website form requests arrive from our own sender address with the visitor
 * in Reply-To and in the display name ("Ada via Shailmann Tech").
 */
function classify(
  from: { name: string; email: string },
  replyTo: { name: string; email: string },
) {
  const isForm =
    from.email === senderAddress().toLowerCase() && Boolean(replyTo.email);
  if (!isForm) {
    return {
      source: "email",
      contactName: from.name,
      contactEmail: from.email,
    };
  }
  const suffix = ` via ${site.name}`;
  const name = from.name.endsWith(suffix)
    ? from.name.slice(0, -suffix.length)
    : replyTo.name;
  return { source: "form", contactName: name, contactEmail: replyTo.email };
}

export type SyncResult = {
  imported: number;
  remaining: number;
  /** Emails filed as automated in this batch. */
  automated: number;
};

export async function syncMailbox(): Promise<SyncResult> {
  const sql = await db();
  const client = await connect();

  try {
    const lock = await client.getMailboxLock(MAILBOX, { readOnly: true });
    try {
      const mailbox = client.mailbox;
      if (!mailbox) throw new Error("Could not open the inbox.");
      const uidValidity = String(mailbox.uidValidity);

      const [state] = await sql<{ uidvalidity: string; last_uid: string }[]>`
        select uidvalidity, last_uid from admin_sync_state
        where mailbox = ${MAILBOX}`;

      let lastUid: number;
      if (state && state.uidvalidity === uidValidity) {
        lastUid = Number(state.last_uid);
      } else {
        // First sync (or the server renumbered the mailbox): start a year back.
        const since = new Date(Date.now() - FIRST_SYNC_DAYS * 86_400_000);
        const recent = (await client.search({ since }, { uid: true })) || [];
        lastUid = recent.length ? Math.min(...recent) - 1 : mailbox.uidNext - 1;
      }

      const pending = (
        (await client.search({ uid: `${lastUid + 1}:*` }, { uid: true })) || []
      )
        // "n:*" always matches the newest message, even when it is older.
        .filter((uid) => uid > lastUid)
        .sort((a, b) => a - b);

      const batch = pending.slice(0, BATCH_SIZE);
      let imported = 0;
      let automated = 0;

      if (batch.length) {
        for await (const message of client.fetch(
          batch.join(","),
          { uid: true, source: true, internalDate: true },
          { uid: true },
        )) {
          if (!message.source) continue;
          const parsed = await simpleParser(message.source);
          const from = firstAddress(parsed.from);
          const replyTo = firstAddress(parsed.replyTo);
          const { source, contactName, contactEmail } = classify(from, replyTo);
          const receivedAt =
            parsed.date ??
            (message.internalDate
              ? new Date(message.internalDate)
              : new Date());
          const body = (parsed.text ?? "").slice(0, MAX_BODY);
          // Website form requests are always from a person.
          const reason =
            source === "form"
              ? null
              : automatedReason(from.email, parsed.headers, from.name);

          const rows = await sql`
            insert into admin_messages (
              uidvalidity, uid, message_id, from_name, from_email,
              contact_name, contact_email, subject, body, source, received_at,
              automated, automated_reason, classified
            ) values (
              ${uidValidity}, ${message.uid}, ${parsed.messageId ?? null},
              ${from.name}, ${from.email}, ${contactName}, ${contactEmail},
              ${parsed.subject ?? ""}, ${body}, ${source}, ${receivedAt},
              ${reason !== null}, ${reason}, true
            )
            on conflict (uidvalidity, uid) do nothing
            returning id`;
          imported += rows.length;
          if (rows.length && reason) automated++;
        }
      }

      const savedUid = batch.length ? batch[batch.length - 1] : lastUid;
      await sql`
        insert into admin_sync_state (mailbox, uidvalidity, last_uid, synced_at)
        values (${MAILBOX}, ${uidValidity}, ${savedUid}, now())
        on conflict (mailbox) do update set
          uidvalidity = excluded.uidvalidity,
          last_uid = excluded.last_uid,
          synced_at = now()`;

      // Emails imported before automated-mail detection existed: re-read just
      // their headers from the mailbox and classify them.
      const unchecked = await sql<
        {
          id: string;
          uid: string;
          source: string;
          from_email: string;
          from_name: string;
        }[]
      >`
        select id, uid, source, from_email, from_name from admin_messages
        where not classified and uidvalidity = ${uidValidity}
        order by uid limit ${CLASSIFY_BATCH}`;
      // Rows from an older mailbox numbering can't be looked up by UID.
      const orphaned = await sql<
        { id: string; source: string; from_email: string; from_name: string }[]
      >`
        select id, source, from_email, from_name from admin_messages
        where not classified and uidvalidity <> ${uidValidity}
        limit ${CLASSIFY_BATCH}`;
      for (const row of orphaned) {
        const reason =
          row.source === "form"
            ? null
            : automatedReason(row.from_email, new Map(), row.from_name);
        await sql`
          update admin_messages
          set automated = ${reason !== null}, automated_reason = ${reason}, classified = true
          where id = ${row.id}`;
        if (reason) automated++;
      }
      if (unchecked.length) {
        const byUid = new Map(unchecked.map((row) => [Number(row.uid), row]));
        const seen = new Set<number>();
        for await (const message of client.fetch(
          [...byUid.keys()].join(","),
          { uid: true, headers: true },
          { uid: true },
        )) {
          const row = byUid.get(message.uid);
          if (!row || !message.headers) continue;
          seen.add(message.uid);
          const parsed = await simpleParser(message.headers);
          const reason =
            row.source === "form"
              ? null
              : automatedReason(row.from_email, parsed.headers, row.from_name);
          await sql`
            update admin_messages
            set automated = ${reason !== null}, automated_reason = ${reason}, classified = true
            where id = ${row.id}`;
          if (reason) automated++;
        }
        // Emails since deleted from the mailbox: classify by sender alone.
        for (const [uid, row] of byUid) {
          if (seen.has(uid)) continue;
          const reason =
            row.source === "form"
              ? null
              : automatedReason(row.from_email, new Map(), row.from_name);
          await sql`
            update admin_messages
            set automated = ${reason !== null}, automated_reason = ${reason}, classified = true
            where id = ${row.id}`;
          if (reason) automated++;
        }
      }
      const [{ count: stillUnchecked }] = await sql<{ count: number }[]>`
        select count(*)::int as count from admin_messages where not classified`;

      return {
        imported,
        remaining: pending.length - batch.length + stillUnchecked,
        automated,
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}
