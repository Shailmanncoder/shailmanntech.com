import "server-only";
import type { ContactPayload } from "@/lib/contact";
import { renderPlainText } from "@/lib/contact-delivery";
import { reportError } from "@/lib/errors";
import { site } from "@/lib/site";
import {
  alertsFor,
  leadAlert,
  sendTelegram,
  telegramConfigured,
} from "@/lib/telegram";
import { aiConfigured, smartReply, type SmartReply } from "./ai";
import { adminDbConfigured, db } from "./db";
import { getMessage, saveSmartReply, type MessageDetail } from "./inbox";
import { defaultRules, getRules } from "./rules";

/**
 * Turns new leads into instant alerts: each is checked against the project
 * rules (and a reply drafted) as soon as it arrives, and good fits are sent
 * to Telegram. Every lead is checked and announced at most once.
 */

const adminUrl = `${site.url}/admin`;

async function rules() {
  return adminDbConfigured() ? getRules() : defaultRules();
}

/** Website form request, right after it was delivered. */
export async function checkFormLead(
  payload: ContactPayload,
  submissionId: string | null,
) {
  if (!aiConfigured() && !telegramConfigured()) return;
  try {
    let result: SmartReply | null = null;
    if (aiConfigured()) {
      const asMessage: MessageDetail = {
        id: `form-${submissionId ?? "new"}`,
        contactName: payload.name,
        contactEmail: payload.email,
        subject: `Project request — ${payload.service}`,
        preview: payload.message.slice(0, 180),
        body: renderPlainText(payload),
        source: "form",
        receivedAt: new Date().toISOString(),
        status: "new",
        archived: false,
        starred: false,
        automated: false,
        automatedReason: null,
        fit: null,
        fromName: payload.name,
        fromEmail: payload.email,
        messageId: null,
        aiAnalysis: null,
        fitReason: null,
        smartDraft: null,
        replies: [],
        mailbox: "INBOX",
        direction: "incoming",
        attachments: [],
      };
      result = await smartReply(asMessage, await rules());
      if (submissionId && adminDbConfigured()) {
        const sql = await db();
        await sql`
          update contact_submissions
          set fit = ${result.decision}, fit_reason = ${result.reason},
              smart_draft = ${result.draft}
          where id = ${submissionId}`;
      }
    }

    // Without AI every request is announced; with it, only the chosen fits.
    const decision = result?.decision ?? "new";
    if (result && !alertsFor(decision)) return;
    const sent = await sendTelegram(
      leadAlert({
        decision,
        reason: result?.reason,
        name: payload.name,
        email: payload.email,
        subject: payload.service,
        preview: payload.message,
        via: "form",
        adminUrl,
      }),
    );
    if (sent && submissionId && adminDbConfigured()) {
      const sql = await db();
      await sql`update contact_submissions set alerted_at = now() where id = ${submissionId}`;
    }
  } catch (error) {
    await reportError("alerts", error, { stage: "checking a form request" });
  }
}

/** How far back the background check looks for unannounced email. */
const LOOKBACK_HOURS = 48;

/**
 * Emails from people that arrived since the last check (not website form
 * requests — those were handled on submission). Returns how many alerts went
 * out.
 */
export async function checkNewInboxLeads(limit = 5) {
  if (!adminDbConfigured() || (!aiConfigured() && !telegramConfigured()))
    return 0;
  const sql = await db();
  const pending = await sql<{ id: string }[]>`
    select id from admin_messages
    where source = 'email' and direction = 'incoming' and mailbox = 'INBOX'
      and not automated and not archived
      and status = 'new' and fit is null and alerted_at is null
      and received_at > now() - make_interval(hours => ${LOOKBACK_HOURS})
    order by received_at
    limit ${limit}`;

  let alerts = 0;
  for (const { id } of pending) {
    try {
      const message = await getMessage(String(id));
      if (!message) continue;
      let result: SmartReply | null = null;
      if (aiConfigured()) {
        result = await smartReply(message, await rules());
        await saveSmartReply(String(id), result);
      }
      // Marked first, so a failed alert is never retried into a duplicate.
      await sql`update admin_messages set alerted_at = now() where id = ${id}`;
      const decision = result?.decision ?? "new";
      if (result && !alertsFor(decision)) continue;
      const sent = await sendTelegram(
        leadAlert({
          decision,
          reason: result?.reason,
          name: message.contactName,
          email: message.contactEmail,
          subject: message.subject,
          preview: message.body,
          via: "email",
          adminUrl,
        }),
      );
      if (sent) alerts++;
    } catch (error) {
      await reportError("alerts", error, {
        stage: "checking an inbox email",
        id,
      });
    }
  }
  return alerts;
}
