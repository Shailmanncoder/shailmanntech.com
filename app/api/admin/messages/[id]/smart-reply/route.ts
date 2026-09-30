import { NextResponse } from "next/server";
import { smartReply } from "@/lib/admin/ai";
import { adminRoute } from "@/lib/admin/api";
import { getMessage, saveSmartReply } from "@/lib/admin/inbox";
import { getRules } from "@/lib/admin/rules";

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
    const result = await smartReply(message, await getRules());
    await saveSmartReply(id, result);
    return NextResponse.json(result);
  },
);
