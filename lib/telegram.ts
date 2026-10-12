import "server-only";
import { reportError } from "./errors";

/**
 * Instant alerts to the owner's Telegram. Configured with TELEGRAM_BOT_TOKEN
 * (from @BotFather) and TELEGRAM_CHAT_ID (the admin's System page finds it).
 * Sending never throws: a failed alert is logged, never lost silently, and
 * never breaks the request that triggered it.
 */

const API = "https://api.telegram.org";

export function telegramConfigured() {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID,
  );
}

function endpoint(method: string) {
  return `${API}/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;
}

/** Text safe for Telegram's HTML formatting. */
export function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegram(html: string): Promise<boolean> {
  if (!telegramConfigured()) return false;
  try {
    const response = await fetch(endpoint("sendMessage"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: html,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        description?: string;
      };
      throw new Error(
        `Telegram refused the alert (${response.status}): ${body.description ?? "no reason given"}`,
      );
    }
    return true;
  } catch (error) {
    await reportError("alerts", error);
    return false;
  }
}

/** Which fit decisions trigger an alert: TELEGRAM_ALERT_ON, default "yes". */
export function alertsFor(decision: string) {
  const wanted = (process.env.TELEGRAM_ALERT_ON ?? "yes")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return wanted.includes("all") || wanted.includes(decision);
}

const HEADINGS: Record<string, string> = {
  yes: "✅ <b>Good-fit lead</b>",
  info: "❓ <b>Lead — needs details</b>",
  other: "💬 <b>New question</b>",
  no: "➖ <b>Not a fit</b>",
  new: "📩 <b>New project request</b>",
};

export function leadAlert(lead: {
  decision: string;
  reason?: string;
  name: string;
  email: string;
  subject: string;
  preview: string;
  via: "form" | "email";
  adminUrl: string;
}) {
  const preview = lead.preview.replace(/\s+/g, " ").trim();
  return [
    HEADINGS[lead.decision] ?? HEADINGS.new,
    "",
    `<b>${escapeHtml(lead.name || lead.email)}</b> · ${escapeHtml(lead.email)}`,
    `${escapeHtml(lead.subject)}${lead.via === "form" ? " (website form)" : ""}`,
    lead.reason ? `\n<i>${escapeHtml(lead.reason)}</i>` : "",
    "",
    escapeHtml(preview.length > 300 ? `${preview.slice(0, 297)}…` : preview),
    "",
    `<a href="${escapeHtml(lead.adminUrl)}">Open in admin →</a>`,
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");
}

/** Confirms the bot token works; returns the bot's @username. */
export async function checkTelegram() {
  const response = await fetch(endpoint("getMe"), {
    signal: AbortSignal.timeout(8000),
  });
  const body = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    result?: { username?: string };
    description?: string;
  };
  if (!body.ok)
    throw new Error(body.description ?? `Telegram answered ${response.status}`);
  return body.result?.username ?? "bot";
}

/**
 * Chats that have recently messaged the bot — how the owner finds the
 * TELEGRAM_CHAT_ID to set: message the bot once, then look here.
 */
export async function recentChats() {
  if (!process.env.TELEGRAM_BOT_TOKEN) return [];
  const response = await fetch(endpoint("getUpdates"), {
    signal: AbortSignal.timeout(8000),
  });
  const body = (await response.json().catch(() => ({}))) as {
    result?: {
      message?: {
        chat?: {
          id: number;
          first_name?: string;
          username?: string;
          title?: string;
        };
      };
    }[];
  };
  const chats = new Map<number, string>();
  for (const update of body.result ?? []) {
    const chat = update.message?.chat;
    if (chat)
      chats.set(
        chat.id,
        chat.title ?? chat.first_name ?? chat.username ?? "chat",
      );
  }
  return [...chats].map(([id, name]) => ({ id: String(id), name }));
}
