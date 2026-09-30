import { NextResponse } from "next/server";
import { adminRoute, readJson } from "@/lib/admin/api";
import { listLeads, saveLead } from "@/lib/admin/workspace";
import { logEvent } from "@/lib/admin/audit";
export const GET = adminRoute(async () =>
  NextResponse.json({ leads: await listLeads() }),
);
export const PUT = adminRoute(async (request: Request) => {
  const input = await readJson(request);
  try {
    const lead = await saveLead(input);
    await logEvent("lead_saved", {
      target: lead.email,
      details: { stage: lead.stage },
    });
    return NextResponse.json({ lead });
  } catch (e) {
    if (e instanceof Error && /valid|Choose|Enter/.test(e.message))
      return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }
});
