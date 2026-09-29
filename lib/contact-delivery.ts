import "server-only";
import type { ContactPayload } from "./contact";
import { site } from "./site";

/**
 * Delivery is deliberately isolated from the route handler and the form.
 *
 * Wiring up a provider is a configuration change, not a code change:
 *   • CONTACT_WEBHOOK_URL  — any endpoint that accepts the JSON payload
 *   • RESEND_API_KEY       — sends through Resend (optionally CONTACT_FROM_EMAIL)
 *
 * With neither set, delivery reports "not_configured" and the UI falls back to
 * email rather than pretending the request was sent.
 */

export type DeliveryResult =
  | { status: "sent" }
  | { status: "not_configured" }
  | { status: "failed"; message: string };

function renderPlainText(payload: ContactPayload) {
  return [
    `New project request from ${site.domain}`,
    "",
    `Name:    ${payload.name}`,
    `Email:   ${payload.email}`,
    `Company: ${payload.company || "—"}`,
    `Service: ${payload.service}`,
    `Budget:  ${payload.budget || "—"}`,
    "",
    "Project description:",
    payload.message,
  ].join("\n");
}

async function deliverViaWebhook(
  url: string,
  payload: ContactPayload,
): Promise<DeliveryResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...payload, source: site.domain }),
  });

  if (!response.ok) {
    return {
      status: "failed",
      message: `Webhook responded with ${response.status}.`,
    };
  }
  return { status: "sent" };
}

/**
 * Sends from the address on our verified domain under a custom display name.
 * The visitor's name can appear in the label ("Ada via Shailmann Tech"), but
 * we can't send as their own address.
 */
function sender(label: string) {
  const configured =
    process.env.CONTACT_FROM_EMAIL ?? `${site.name} <onboarding@resend.dev>`;
  const address = configured.match(/<([^>]+)>/)?.[1] ?? configured.trim();
  return `"${label.replace(/["<>\\\r\n]/g, "").trim()}" <${address}>`;
}

async function sendViaResend(
  apiKey: string,
  email: Record<string, unknown>,
): Promise<DeliveryResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(email),
  });

  if (!response.ok) {
    return {
      status: "failed",
      message: `Email provider responded with ${response.status}: ${await response.text()}`,
    };
  }
  return { status: "sent" };
}

function renderAutoReply(payload: ContactPayload) {
  return [
    `Hi ${payload.name},`,
    "",
    `Thanks for getting in touch with ${site.name}. We've received your project request and will reply within 1–2 business days.`,
    "",
    "Here's a copy of what you sent:",
    "",
    `Service: ${payload.service}`,
    `Budget:  ${payload.budget || "—"}`,
    "",
    payload.message,
    "",
    "If you have anything to add, just reply to this email.",
    "",
    `— ${site.name}`,
    site.url,
  ].join("\n");
}

async function deliverViaResend(
  apiKey: string,
  payload: ContactPayload,
): Promise<DeliveryResult> {
  const result = await sendViaResend(apiKey, {
    from: sender(`${payload.name} via ${site.name}`),
    to: [process.env.CONTACT_TO_EMAIL ?? site.email],
    reply_to: payload.email,
    subject: `Project request — ${payload.service}`,
    text: renderPlainText(payload),
  });

  if (result.status !== "sent") return result;

  // The request is already with us, so a failed confirmation must not turn
  // the visitor's submission into an error.
  const confirmation = await sendViaResend(apiKey, {
    from: sender(site.name),
    to: [payload.email],
    reply_to: process.env.CONTACT_TO_EMAIL ?? site.email,
    subject: `We've received your request — ${site.name}`,
    text: renderAutoReply(payload),
  }).catch((error: unknown) => ({
    status: "failed" as const,
    message: error instanceof Error ? error.message : String(error),
  }));

  if (confirmation.status === "failed") {
    console.error("Contact auto-reply failed:", confirmation.message);
  }
  return result;
}

export async function deliverContactRequest(
  payload: ContactPayload,
): Promise<DeliveryResult> {
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;

  try {
    if (webhook) return await deliverViaWebhook(webhook, payload);
    if (resendKey) return await deliverViaResend(resendKey, payload);
    return { status: "not_configured" };
  } catch (error) {
    return {
      status: "failed",
      message:
        error instanceof Error ? error.message : "Unknown delivery error.",
    };
  }
}
