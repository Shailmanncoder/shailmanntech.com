import { NextResponse } from "next/server";
import { endSession } from "@/lib/portal/auth";
import { portalRoute } from "@/lib/portal/api";

export const runtime = "nodejs";

export const POST = portalRoute(async () => {
  await endSession();
  return NextResponse.json({ ok: true });
});
