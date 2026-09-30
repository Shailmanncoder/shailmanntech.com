import { NextResponse } from "next/server";
import { adminRoute, readJson } from "@/lib/admin/api";
import { logEvent } from "@/lib/admin/audit";
import { resolveErrors } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Marks errors as dealt with: { ids: ["1", "2"] } or { all: true }. */
export const POST = adminRoute(async (request: Request) => {
  const body = await readJson(request);
  const ids = Array.isArray(body.ids)
    ? body.ids.filter(
        (id): id is string => typeof id === "string" && /^\d+$/.test(id),
      )
    : [];
  await resolveErrors(body.all === true ? "all" : ids);
  await logEvent("errors_resolved", {
    details: body.all === true ? { all: true } : { count: ids.length },
  });
  return NextResponse.json({ ok: true });
});
