import "server-only";

/**
 * Cloudflare Turnstile verification for the contact form.
 *
 * Enabled by TURNSTILE_SECRET_KEY (with NEXT_PUBLIC_TURNSTILE_SITE_KEY on the
 * client). Without the secret the check is skipped, so local development works
 * with no Cloudflare account.
 */

export async function verifyTurnstile(
  token: string,
  remoteIp: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
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
