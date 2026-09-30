import { NextResponse } from "next/server";
import { analyzeEmail } from "@/lib/admin/ai";
import { adminRoute } from "@/lib/admin/api";
import { getMessage, saveAnalysis } from "@/lib/admin/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };

export const POST = adminRoute(
  async (_request: Request, { params }: Context) => {
    const { id } = await params;
    const message = /^\d+$/.test(id) ? await getMessage(id) : null;
    if (!message) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const analysis = await analyzeEmail(message);
    await saveAnalysis(id, analysis);
    return NextResponse.json({ analysis });
  },
);
