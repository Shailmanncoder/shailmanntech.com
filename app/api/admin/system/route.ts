import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { listEvents } from "@/lib/admin/audit";
import { runHealthChecks } from "@/lib/admin/health";
import { listErrors } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const GET = adminRoute(async () => {
  const [checks, errors, events] = await Promise.all([
    runHealthChecks(),
    listErrors(),
    listEvents(),
  ]);
  return NextResponse.json({
    checks,
    errors,
    events,
    checkedAt: new Date().toISOString(),
  });
});
