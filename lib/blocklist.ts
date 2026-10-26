/**
 * Rules for blocked senders, shared by the server and the admin screens.
 * A pattern is a full address ("name@example.com") or a domain
 * ("example.com", which also covers mail.example.com).
 */

const ADDRESS = /^[^\s@]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

/** Shared mail providers: blocking one would block thousands of strangers. */
export const SHARED_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.co.in",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "gmx.com",
  "mail.com",
  "yandex.com",
  "rediffmail.com",
]);

export type PatternCheck =
  | { ok: true; pattern: string; kind: "address" | "domain" }
  | { ok: false; error: string };

/**
 * Cleans up what was typed and checks it can be blocked. `own` lists our
 * addresses, which can never be blocked.
 */
export function checkPattern(input: string, own: string[] = []): PatternCheck {
  const pattern = input
    .trim()
    .toLowerCase()
    .replace(/^mailto:/, "")
    .replace(/^\*?@/, "");
  const kind = pattern.includes("@") ? "address" : "domain";
  if (kind === "address" ? !ADDRESS.test(pattern) : !DOMAIN.test(pattern)) {
    return {
      ok: false,
      error: "Enter an email address (name@example.com) or a domain (example.com).",
    };
  }
  const domain = kind === "address" ? pattern.split("@")[1] : pattern;
  const ours = own.map((a) => a.trim().toLowerCase());
  if (
    ours.includes(pattern) ||
    ours.some((a) => {
      const ourDomain = a.split("@")[1] ?? "";
      return (
        kind === "domain" &&
        (ourDomain === domain || ourDomain.endsWith(`.${domain}`))
      );
    })
  ) {
    return { ok: false, error: "You can't block your own address." };
  }
  if (kind === "domain" && SHARED_DOMAINS.has(domain)) {
    return {
      ok: false,
      error: `${domain} is shared by millions of people. Block the person's own address instead.`,
    };
  }
  return { ok: true, pattern, kind };
}

/** Whether `email` matches a pattern (mirrors is_blocked_sender in SQL). */
export function matchesPattern(email: string, pattern: string) {
  const address = email.trim().toLowerCase();
  if (pattern.includes("@")) return address === pattern;
  return address.endsWith(`@${pattern}`) || address.endsWith(`.${pattern}`);
}
