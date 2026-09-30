import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { logEvent } from "@/lib/admin/audit";
import { SESSION_COOKIE, revokeAllSessions } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "Sign out all devices": ends every session, including this one. */
export const DELETE = adminRoute(async () => {
  await logEvent("sessions_revoked");
  await revokeAllSessions();
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
});
