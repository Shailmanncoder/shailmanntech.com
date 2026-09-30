import "server-only";
import { createHash } from "node:crypto";
import {
  displayAddress,
  inboxAddress,
  sendViaResend,
} from "@/lib/contact-delivery";
import { site } from "@/lib/site";
import { db } from "./db";

export type FitDecision = "yes" | "no" | "info" | "other" | "spam";

export type MessageStatus = "new" | "read" | "replied";

export type MessageSummary = {
  id: string;
  contactName: string;
  contactEmail: string;
  subject: string;
  preview: string;
  source: "form" | "email";
  receivedAt: string;
  status: MessageStatus;
  archived: boolean;
  starred: boolean;
  automated: boolean;
  automatedReason: string | null;
  /** AI project-fit decision, once checked. */
  fit: FitDecision | null;
};

export type Reply = { id: string; body: string; sentAt: string };

export type MessageDetail = MessageSummary & {
  body: string;
  fromName: string;
  fromEmail: string;
  messageId: string | null;
  aiAnalysis: string | null;
  /** One line explaining the fit decision. */
  fitReason: string | null;
  /** The reply the AI drafted from the fit check, waiting for review. */
  smartDraft: string | null;
  replies: Reply[];
};

export type InboxFilter =
  | "all"
  | "awaiting"
  | "form"
  | "starred"
  | "replied"
  | "archived"
  | "automated";

type Row = {
  id: string;
  contact_name: string;
  contact_email: string;
  subject: string;
  body: string;
  source: "form" | "email";
  received_at: Date;
  status: MessageStatus;
  archived: boolean;
  starred: boolean;
  automated: boolean;
  automated_reason: string | null;
  fit: FitDecision | null;
};

function toSummary(row: Row): MessageSummary {
  return {
    id: String(row.id),
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    subject: row.subject || "(no subject)",
    preview: row.body.replace(/\s+/g, " ").trim().slice(0, 180),
    source: row.source,
    receivedAt: row.received_at.toISOString(),
    status: row.status,
    archived: row.archived,
    starred: row.starred,
    automated: row.automated,
    automatedReason: row.automated_reason,
    fit: row.fit,
  };
}

export async function listMessages(filter: InboxFilter, search: string) {
  const sql = await db();
  const term = search.trim() ? `%${search.trim()}%` : null;

  const where = {
    all: sql`not automated and not archived`,
    awaiting: sql`not automated and not archived and status <> 'replied'`,
    form: sql`not automated and not archived and source = 'form'`,
    starred: sql`starred`,
    replied: sql`not automated and status = 'replied'`,
    archived: sql`not automated and archived`,
    automated: sql`automated`,
  }[filter];

  const rows = await sql<Row[]>`
    select id, contact_name, contact_email, subject, left(body, 400) as body,
           source, received_at, status, archived, starred,
           automated, automated_reason, fit
    from admin_messages
    where ${where}
    ${
      term
        ? sql`and (subject ilike ${term} or body ilike ${term}
                or contact_name ilike ${term} or contact_email ilike ${term})`
        : sql``
    }
    order by received_at desc
    limit 200`;
  return rows.map(toSummary);
}

export async function getMessage(id: string): Promise<MessageDetail | null> {
  const sql = await db();
  const [row] = await sql<
    (Row & {
      from_name: string;
      from_email: string;
      message_id: string | null;
      ai_analysis: string | null;
      fit_reason: string | null;
      smart_draft: string | null;
    })[]
  >`select * from admin_messages where id = ${id}`;
  if (!row) return null;

  const replies = await sql<{ id: string; body: string; sent_at: Date }[]>`
    select id, body, sent_at from admin_replies
    where message_id = ${id} and status = 'sent' order by sent_at`;

  return {
    ...toSummary(row),
    body: row.body,
    fromName: row.from_name,
    fromEmail: row.from_email,
    messageId: row.message_id,
    aiAnalysis: row.ai_analysis,
    fitReason: row.fit_reason,
    smartDraft: row.smart_draft,
    replies: replies.map((r) => ({
      id: String(r.id),
      body: r.body,
      sentAt: r.sent_at.toISOString(),
    })),
  };
}

export async function updateMessage(
  id: string,
  changes: {
    status?: MessageStatus;
    archived?: boolean;
    starred?: boolean;
    automated?: boolean;
  },
) {
  const sql = await db();
  const allowed = Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  );
  if (Object.keys(allowed).length === 0) return;
  // A manual choice replaces the automatic reason.
  if ("automated" in allowed) {
    Object.assign(allowed, {
      automated_reason: allowed.automated ? "Marked by you" : null,
      classified: true,
    });
  }
  await sql`update admin_messages set ${sql(allowed)} where id = ${id}`;
}

export async function saveSmartReply(
  id: string,
  result: { decision: FitDecision; reason: string; draft: string },
) {
  const sql = await db();
  await sql`
    update admin_messages
    set fit = ${result.decision}, fit_reason = ${result.reason},
        smart_draft = ${result.draft}, smart_draft_at = now()
    where id = ${id}`;
}

export async function saveAnalysis(id: string, analysis: string) {
  const sql = await db();
  await sql`
    update admin_messages set ai_analysis = ${analysis}, ai_analysis_at = now()
    where id = ${id}`;
}

function quoteOriginal(message: MessageDetail) {
  const when = new Date(message.receivedAt).toUTCString();
  const who = message.contactName || message.contactEmail;
  const quoted = message.body
    .trim()
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return `On ${when}, ${who} wrote:\n${quoted}`;
}

/**
 * The same reply to the same email always gets the same key, so a double
 * click, a network retry or a save that failed after sending can't produce a
 * second email.
 */
export function replyKey(messageId: string, body: string) {
  const normalised = body.trim().replace(/\r\n/g, "\n");
  return createHash("sha256")
    .update(`${messageId}\n${normalised}`)
    .digest("hex");
}

/** How long an unconfirmed send blocks a retry, in case it's still in flight. */
const SENDING_GRACE_SECONDS = 90;

export type SendReplyResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; error: string; status: number };

export async function sendReply(
  message: MessageDetail,
  body: string,
): Promise<SendReplyResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not set.", status: 503 };
  }

  const sql = await db();
  const text = body.trim();
  const key = replyKey(message.id, text);

  // 1. Record the reply before sending it.
  const [claimed] = await sql<{ id: string }[]>`
    insert into admin_replies (message_id, body, status, idempotency_key)
    values (${message.id}, ${text}, 'sending', ${key})
    on conflict (idempotency_key) do nothing
    returning id`;

  let replyId = claimed?.id;
  if (!replyId) {
    const [existing] = await sql<{ id: string; status: string; age: number }[]>`
      select id, status, extract(epoch from now() - sent_at)::int as age
      from admin_replies where idempotency_key = ${key}`;
    if (existing?.status === "sent") {
      // Already delivered: make sure the email shows as replied, don't resend.
      await sql`
        update admin_messages set status = 'replied', smart_draft = null
        where id = ${message.id}`;
      return { ok: true, duplicate: true };
    }
    if (
      existing?.status === "sending" &&
      existing.age < SENDING_GRACE_SECONDS
    ) {
      return {
        ok: false,
        error: "This reply is already being sent. Check again in a minute.",
        status: 409,
      };
    }
    // A stale or failed attempt: retry it under the same key. If the earlier
    // attempt did reach Resend, Resend recognises the key and won't send again.
    replyId = existing?.id;
    await sql`
      update admin_replies set status = 'sending', sent_at = now()
      where id = ${replyId}`;
  }

  // 2. Send, telling Resend the key so it drops any repeat.
  const subject = /^re:/i.test(message.subject)
    ? message.subject
    : `Re: ${message.subject}`;
  const threading = message.messageId
    ? { "In-Reply-To": message.messageId, References: message.messageId }
    : undefined;
  const result = await sendViaResend(
    apiKey,
    {
      from: displayAddress(site.name, inboxAddress()),
      to: [message.contactEmail],
      reply_to: inboxAddress(),
      subject,
      text: `${text}\n\n${quoteOriginal(message)}`,
      headers: threading,
    },
    { idempotencyKey: `reply-${key}` },
  );

  if (result.status !== "sent") {
    await sql`update admin_replies set status = 'failed' where id = ${replyId}`;
    return {
      ok: false,
      error: "message" in result ? result.message : "Not sent.",
      status: 502,
    };
  }

  // 3. Confirm. If this fails, the row stays "sending" and a retry is safe.
  await sql`
    update admin_replies
    set status = 'sent', sent_at = now(), provider_id = ${result.id ?? null}
    where id = ${replyId}`;
  await sql`
    update admin_messages set status = 'replied', smart_draft = null
    where id = ${message.id}`;
  return { ok: true, duplicate: false };
}

/* ------------------------------------------------------------------ */
/*  Dashboard numbers                                                  */
/* ------------------------------------------------------------------ */

export type MonthlyCount = { month: string; form: number; email: number };

export type InboxStats = {
  total: number;
  thisMonth: number;
  lastMonth: number;
  awaiting: number;
  replied: number;
  medianReplyHours: number | null;
  monthly: MonthlyCount[];
  lastSyncedAt: string | null;
  /** Sidebar badges: unread in the inbox, and the size of each folder. */
  counts: {
    unread: number;
    awaiting: number;
    form: number;
    starred: number;
    automated: number;
    /** Unresolved entries on the System page. */
    errors: number;
  };
  /** The longest-waiting unanswered emails from the last 30 days. */
  needsReply: MessageSummary[];
  /** Services named in website form requests over the last 12 months. */
  topServices: { service: string; count: number }[];
};

export async function getStats(): Promise<InboxStats> {
  const sql = await db();

  const [totals] = await sql<
    {
      total: number;
      this_month: number;
      last_month: number;
      awaiting: number;
      replied: number;
    }[]
  >`
    select
      count(*)::int as total,
      count(*) filter (where received_at >= date_trunc('month', now()))::int as this_month,
      count(*) filter (where received_at >= date_trunc('month', now()) - interval '1 month'
                         and received_at < date_trunc('month', now()))::int as last_month,
      count(*) filter (where not archived and status <> 'replied')::int as awaiting,
      count(*) filter (where status = 'replied')::int as replied
    from admin_messages
    where not automated`;

  const [speed] = await sql<{ hours: number | null }[]>`
    select percentile_cont(0.5) within group (
      order by extract(epoch from first_reply - m.received_at) / 3600
    ) as hours
    from admin_messages m
    join (select message_id, min(sent_at) as first_reply
          from admin_replies where status = 'sent' group by message_id) r
      on r.message_id = m.id
    where not m.automated`;

  const monthly = await sql<{ month: Date; form: number; email: number }[]>`
    select months.month,
      count(m.id) filter (where m.source = 'form')::int as form,
      count(m.id) filter (where m.source = 'email')::int as email
    from generate_series(
      date_trunc('month', now()) - interval '11 months',
      date_trunc('month', now()),
      interval '1 month'
    ) as months(month)
    left join admin_messages m
      on date_trunc('month', m.received_at) = months.month
      and not m.automated
    group by months.month
    order by months.month`;

  const [sync] = await sql<{ synced_at: Date }[]>`
    select synced_at from admin_sync_state limit 1`;

  const [counts] = await sql<
    {
      unread: number;
      awaiting: number;
      form: number;
      starred: number;
      automated: number;
      errors: number;
    }[]
  >`
    select
      count(*) filter (where not automated and not archived and status = 'new')::int as unread,
      count(*) filter (where not automated and not archived and status <> 'replied')::int as awaiting,
      count(*) filter (where not automated and not archived and source = 'form')::int as form,
      count(*) filter (where starred)::int as starred,
      count(*) filter (where automated)::int as automated,
      (select count(*)::int from app_errors where not resolved) as errors
    from admin_messages`;

  const needsReply = await sql<Row[]>`
    select id, contact_name, contact_email, subject, left(body, 400) as body,
           source, received_at, status, archived, starred,
           automated, automated_reason, fit
    from admin_messages
    where not automated and not archived and status <> 'replied'
      and received_at >= now() - interval '30 days'
    order by received_at asc
    limit 5`;

  // Form subjects read "Project request — <service>".
  const topServices = await sql<{ service: string; count: number }[]>`
    select trim(split_part(subject, '—', 2)) as service, count(*)::int as count
    from admin_messages
    where source = 'form' and position('—' in subject) > 0
      and received_at >= now() - interval '12 months'
    group by 1
    order by count desc, service
    limit 6`;

  return {
    total: totals.total,
    thisMonth: totals.this_month,
    lastMonth: totals.last_month,
    awaiting: totals.awaiting,
    replied: totals.replied,
    medianReplyHours: speed?.hours == null ? null : Number(speed.hours),
    monthly: monthly.map((m) => ({
      month: m.month.toISOString().slice(0, 7),
      form: m.form,
      email: m.email,
    })),
    lastSyncedAt: sync ? sync.synced_at.toISOString() : null,
    counts,
    needsReply: needsReply.map(toSummary),
    topServices: topServices.filter((t) => t.service),
  };
}

/** Compact listing of recent mail for the AI assistant to reason over. */
export async function recentForAssistant(limit = 150) {
  const sql = await db();
  const rows = await sql<Row[]>`
    select id, contact_name, contact_email, subject, left(body, 500) as body,
           source, received_at, status, archived, starred,
           automated, automated_reason, fit
    from admin_messages where not automated
    order by received_at desc limit ${limit}`;
  return rows.map(toSummary);
}

export async function exportAll() {
  const sql = await db();
  return sql<Row[]>`
    select id, contact_name, contact_email, subject, body, source,
           received_at, status, archived, starred, automated, automated_reason, fit
    from admin_messages order by received_at desc`;
}
