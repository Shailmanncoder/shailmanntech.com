/**
 * Shared contact-request contract. Used by the form on the client and by the
 * API route on the server so both sides validate against the same rules.
 */

export type ContactPayload = {
  name: string;
  email: string;
  company?: string;
  service: string;
  message: string;
  budget?: string;
  /** Honeypot — must stay empty. */
  website?: string;
};

export type FieldErrors = Partial<Record<keyof ContactPayload, string>>;

export const budgetOptions = [
  "Not sure yet",
  "Under $5,000",
  "$5,000 – $15,000",
  "$15,000 – $50,000",
  "$50,000+",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MESSAGE_MIN_LENGTH = 20;

export function validateContact(payload: ContactPayload): FieldErrors {
  const errors: FieldErrors = {};

  if (payload.name.trim().length < 2) {
    errors.name = "Please enter your name.";
  }
  if (!EMAIL_PATTERN.test(payload.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!payload.service.trim()) {
    errors.service = "Please choose the service you need.";
  }
  if (payload.message.trim().length < MESSAGE_MIN_LENGTH) {
    errors.message = `Please add a little more detail (at least ${MESSAGE_MIN_LENGTH} characters).`;
  }

  return errors;
}

export type ContactResponse =
  | { ok: true }
  | { ok: false; code: "invalid"; errors: FieldErrors }
  | { ok: false; code: "not_configured"; message: string }
  | { ok: false; code: "failed"; message: string };

/** Builds an email fallback that carries everything the visitor already typed. */
export function buildMailtoFallback(
  to: string,
  payload: ContactPayload,
): string {
  const subject = `Project request — ${payload.service || "General enquiry"}`;
  const body = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.company ? `Company: ${payload.company}` : null,
    `Service needed: ${payload.service}`,
    payload.budget ? `Budget range: ${payload.budget}` : null,
    "",
    "Project description:",
    payload.message,
  ]
    .filter(Boolean)
    .join("\n");

  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
