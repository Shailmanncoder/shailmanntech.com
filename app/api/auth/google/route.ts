import { NextResponse } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  googleConfigured,
  startGoogleSignIn,
} from "@/lib/portal/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sends the visitor to Google to sign in. */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!googleConfigured())
    return NextResponse.redirect(`${origin}/login?error=google_off`);
  const { url, cookie } = startGoogleSignIn(origin);
  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_STATE_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return response;
}
