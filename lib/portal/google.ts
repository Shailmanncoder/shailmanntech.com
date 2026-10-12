import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * "Continue with Google" using Google's OAuth 2.0 code flow with PKCE.
 * Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from Google Cloud Console,
 * with <site>/api/auth/google/callback as an authorised redirect URI.
 */

export const GOOGLE_STATE_COOKIE = "smt_google";

export function googleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

export function callbackUrl(origin: string) {
  return `${origin}/api/auth/google/callback`;
}

/** Starts sign-in: returns Google's URL and the state to keep in a cookie. */
export function startGoogleSignIn(origin: string) {
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: callbackUrl(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return { url: url.toString(), cookie: `${state}.${verifier}` };
}

export type GoogleProfile = { sub: string; email: string; name: string };

/** Finishes sign-in: swaps the code for the person's verified Google profile. */
export async function finishGoogleSignIn(
  origin: string,
  code: string,
  verifier: string,
): Promise<GoogleProfile> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      code,
      code_verifier: verifier,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: callbackUrl(origin),
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const tokens = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
  };
  if (!tokenResponse.ok || !tokens.access_token) {
    throw new Error(
      `Google refused the sign-in (${tokens.error ?? tokenResponse.status}).`,
    );
  }

  // Asked straight from Google over TLS with the token we just received.
  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { authorization: `Bearer ${tokens.access_token}` },
      signal: AbortSignal.timeout(10_000),
    },
  );
  const profile = (await profileResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  if (!profile.sub || !profile.email)
    throw new Error("Google didn't share an email address.");
  if (profile.email_verified !== true) {
    throw new Error("That Google account's email address isn't verified.");
  }
  return {
    sub: profile.sub,
    email: profile.email.toLowerCase(),
    name: profile.name ?? "",
  };
}
