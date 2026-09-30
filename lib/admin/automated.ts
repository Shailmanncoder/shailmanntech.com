import "server-only";
import type { HeaderValue } from "mailparser";

/**
 * Decides whether an email was sent by a machine (service notices, receipts,
 * newsletters, no-reply senders) rather than written by a person. Automated
 * mail is kept but filed away from the inbox, stats and AI.
 *
 * ADMIN_IGNORE_SENDERS and ADMIN_ALLOW_SENDERS (comma-separated addresses or
 * domains) override the built-in rules.
 */

/**
 * Sending infrastructure that only ever carries machine mail: anything from
 * these domains is automated.
 */
const SYSTEM_DOMAINS = [
  "secureserver.net",
  "titan.email",
  "resend.dev",
  "amazonses.com",
  "sendgrid.net",
  "mcsv.net",
  "mailchimp.com",
  "facebookmail.com",
];

/**
 * Companies that mostly send account and service notices, but whose staff
 * are real people too. Mail from them counts as automated only when the
 * address doesn't look like a person's (see looksPersonal).
 */
const SERVICE_DOMAINS = [
  "godaddy.com",
  "resend.com",
  "vercel.com",
  "github.com",
  "gitlab.com",
  "google.com",
  "googlemail.com",
  "stripe.com",
  "paypal.com",
  "razorpay.com",
  "amazonaws.com",
  "cloudflare.com",
  "neon.tech",
  "openai.com",
  "anthropic.com",
  "linkedin.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "slack.com",
  "notion.so",
  "canva.com",
  "figma.com",
  "atlassian.net",
  "microsoft.com",
  "apple.com",
  "namecheap.com",
  "hostinger.com",
  "zoho.com",
];

/**
 * True when the address reads like a person: "zeno.rocha@", "zeno_rocha@",
 * or a first name that matches the sender's display name ("zeno@" from
 * "Zeno Rocha").
 */
/** Words that name a role or team rather than a person. */
const ROLE_WORDS = new Set([
  "team",
  "the",
  "support",
  "help",
  "hello",
  "hi",
  "info",
  "sales",
  "contact",
  "admin",
  "office",
  "service",
  "services",
  "customer",
  "customers",
  "care",
  "mail",
  "notification",
  "notifications",
  "updates",
  "news",
  "billing",
  "accounts",
  "security",
]);

export function looksPersonal(email: string, name: string) {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  const parts = local.split(/[._-]/);
  if (parts.some((part) => ROLE_WORDS.has(part))) return false;
  // first.last, first_last, first-l
  if (/^[a-z]{2,}[._-][a-z]+$/.test(local)) return true;
  const nameParts = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  // "zeno@" from "Zeno Rocha": a first or last name from a two-part name.
  return nameParts.length >= 2 && nameParts.includes(local);
}

/** Mailbox names that belong to systems, not people. */
const MACHINE_LOCAL_PART =
  /^(no-?reply|do-?not-?reply|noreply[\w.-]*|notifications?|notify|alerts?|mailer-daemon|postmaster|bounces?|billing|invoices?|receipts?|payments?|newsletters?|news|marketing|updates?|digest|security|verify|verification|accounts?|automated|system|robot|daemon)([+.-].*)?$/i;

/** Tools whose stamp in X-Mailer means a campaign, not a personal email. */
const BULK_MAILERS =
  /mailchimp|sendgrid|mailgun|sendinblue|brevo|hubspot|klaviyo|constant ?contact|campaign|marketo|salesforce|amazon ses|postmark|sparkpost|mailerlite|convertkit|substack/i;

function listSetting(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function matchesSender(email: string, entries: string[]) {
  const domain = email.split("@")[1] ?? "";
  return entries.some(
    (entry) =>
      entry === email ||
      entry === domain ||
      (!entry.includes("@") && domain.endsWith(`.${entry}`)),
  );
}

function headerText(value: HeaderValue | undefined): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((v) => headerText(v)).join(" ");
  const structured = value as { value?: unknown; text?: unknown };
  if (typeof structured.value === "string") return structured.value;
  if (typeof structured.text === "string") return structured.text;
  return String(value);
}

/** Returns why the email looks automated, or null when a person sent it. */
export function automatedReason(
  fromEmail: string,
  headers: Map<string, HeaderValue>,
  fromName = "",
): string | null {
  const email = fromEmail.toLowerCase();
  if (matchesSender(email, listSetting("ADMIN_ALLOW_SENDERS"))) return null;
  if (matchesSender(email, listSetting("ADMIN_IGNORE_SENDERS"))) {
    return "On your ignore list";
  }
  if (!email) return "No sender address";

  const header = (name: string) =>
    headerText(headers.get(name)).trim().toLowerCase();

  const autoSubmitted = header("auto-submitted");
  if (autoSubmitted && autoSubmitted !== "no") return "Auto-submitted";
  if (/^(bulk|list|junk|auto_reply)/.test(header("precedence")))
    return "Bulk mail";
  // mailparser gathers List-Unsubscribe, List-Id and friends under "list".
  if (headers.has("list") || header("list-unsubscribe") || header("list-id"))
    return "Mailing list or newsletter";
  if (header("x-auto-response-suppress")) return "Automatic notification";
  if (header("feedback-id") || header("x-campaign-id") || header("x-mc-user")) {
    return "Marketing email";
  }
  if (BULK_MAILERS.test(header("x-mailer"))) return "Sent by a bulk-mail tool";

  const [local] = email.split("@");
  if (MACHINE_LOCAL_PART.test(local)) return "No-reply or system address";
  if (matchesSender(email, SYSTEM_DOMAINS)) return "Sent by an email service";
  if (
    matchesSender(email, SERVICE_DOMAINS) &&
    !looksPersonal(email, fromName)
  ) {
    return "Service or account notice";
  }

  return null;
}
