import { NextResponse } from "next/server";
import { adminRoute, readJson } from "@/lib/admin/api";
import { logEvent } from "@/lib/admin/audit";
import { getRules, saveRules } from "@/lib/admin/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => NextResponse.json(await getRules()));

export const PUT = adminRoute(async (request: Request) => {
  const rules = await saveRules(await readJson(request));
  await logEvent("rules_saved");
  return NextResponse.json(rules);
});
