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

async function deliverViaResend(
  apiKey: string,
  payload: ContactPayload,
): Promise<DeliveryResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.CONTACT_FROM_EMAIL ??
        `${site.name} <onboarding@resend.dev>`,
      to: [process.env.CONTACT_TO_EMAIL ?? site.email],
      reply_to: payload.email,
      subject: `Project request — ${payload.service}`,
      text: renderPlainText(payload),
    }),
  });

  if (!response.ok) {
    return {
      status: "failed",
      message: `Email provider responded with ${response.status}.`,
    };
  }
  return { status: "sent" };
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
