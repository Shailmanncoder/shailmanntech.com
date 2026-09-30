import "server-only";
import { isProduction } from "./config";
import { reportError } from "./errors";

/**
 * Cloudflare Turnstile verification for the contact form.
 *
 * Enabled by TURNSTILE_SECRET_KEY (with NEXT_PUBLIC_TURNSTILE_SITE_KEY on the
 * client). Production refuses every submission unless both are set; local
 * development skips the check so it works without a Cloudflare account (the
 * contact route's rate limits still apply).
 */

export async function verifyTurnstile(
  token: string,
  remoteIp: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Production must have the bot check, and a page that shows the widget
    // without a server secret is a broken deployment. Either way, refuse
    // rather than let requests through unchecked. Local development runs
    // without it (rate limits still apply).
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || isProduction()) {
      await reportError(
        "config",
        "Contact form refused a submission: Turnstile isn't fully configured.",
      );
      return false;
    }
    return true;
  }
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const result = (await response.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    if (!result.success) {
      console.error("Turnstile rejected:", result["error-codes"]);
    }
    return result.success;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}
