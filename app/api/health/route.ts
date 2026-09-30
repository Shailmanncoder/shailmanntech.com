import { NextResponse } from "next/server";
import {
  adminDbConfigured,
  appliedSchemaVersion,
  EXPECTED_SCHEMA_VERSION,
} from "@/lib/admin/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public health check for uptime monitors: 200 when the site and its database
 * are working, 503 otherwise. It deliberately reveals nothing else.
 */
export async function GET() {
  let healthy = true;
  if (adminDbConfigured()) {
    try {
      const version = await appliedSchemaVersion();
      healthy = Boolean(version && version >= EXPECTED_SCHEMA_VERSION);
    } catch {
      healthy = false;
    }
  }
  return NextResponse.json(
    { status: healthy ? "ok" : "down" },
    { status: healthy ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
