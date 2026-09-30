import "server-only";

/**
 * What a production deployment must have configured. Missing security
 * settings make the feature they protect refuse to run (see verifyTurnstile);
 * everything here is also listed on the admin's System page.
 */

export function isProduction() {
  // On Vercel, preview deployments run with NODE_ENV=production too.
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.NODE_ENV === "production";
}

export type ConfigIssue = { severity: "error" | "warning"; message: string };

const MIN_PASSWORD_LENGTH = 12;

export function configIssues(): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const env = process.env;
  const production = isProduction();

  const turnstileSite = Boolean(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const turnstileSecret = Boolean(env.TURNSTILE_SECRET_KEY);
  if (turnstileSite && !turnstileSecret) {
    issues.push({
      severity: "error",
      message:
        "TURNSTILE_SECRET_KEY is missing, so the contact form refuses every submission.",
    });
  } else if (!turnstileSite && production) {
    issues.push({
      severity: "error",
      message:
        "Turnstile isn't configured, so the contact form refuses submissions in production. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY.",
    });
  } else if (turnstileSecret && !turnstileSite) {
    issues.push({
      severity: "warning",
      message:
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing, so the page shows no bot check.",
    });
  }

  if (!env.RESEND_API_KEY) {
    issues.push({
      severity: "warning",
      message: "RESEND_API_KEY isn't set, so no email can be sent.",
    });
  }
  if (env.RESEND_API_KEY && !env.CONTACT_FROM_EMAIL) {
    issues.push({
      severity: "warning",
      message:
        "CONTACT_FROM_EMAIL isn't set, so mail goes out from Resend's test address.",
    });
  }

  if (env.ADMIN_PASSWORD && env.ADMIN_PASSWORD.length < MIN_PASSWORD_LENGTH) {
    issues.push({
      severity: "warning",
      message: `The admin password is shorter than ${MIN_PASSWORD_LENGTH} characters.`,
    });
  }
  if (env.ADMIN_USERNAME && !env.ADMIN_SESSION_SECRET) {
    issues.push({
      severity: "warning",
      message:
        "ADMIN_SESSION_SECRET isn't set, so sign-in cookies are signed with a key derived from the password.",
    });
  }
  if (!env.DATABASE_URL) {
    issues.push({
      severity: "warning",
      message:
        "DATABASE_URL isn't set, so rate limits only apply within one server instance.",
    });
  }
  return issues;
}
