import { NextResponse } from "next/server";
import { askAboutInbox } from "@/lib/admin/ai";
import { adminRoute, readJson, text } from "@/lib/admin/api";
import { getStats, recentForAssistant } from "@/lib/admin/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = adminRoute(async (request: Request) => {
  const question = text((await readJson(request)).question, 2000).trim();
  if (!question) {
    return NextResponse.json(
      { error: "Ask a question first." },
      { status: 422 },
    );
  }
  const [stats, recent] = await Promise.all([getStats(), recentForAssistant()]);
  return NextResponse.json({
    answer: await askAboutInbox(question, stats, recent),
  });
});
