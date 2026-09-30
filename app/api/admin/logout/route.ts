import { NextResponse } from "next/server";
import { logEvent } from "@/lib/admin/audit";
import { SESSION_COOKIE, isAdmin } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function POST() {
  if (await isAdmin()) await logEvent("logout");
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
