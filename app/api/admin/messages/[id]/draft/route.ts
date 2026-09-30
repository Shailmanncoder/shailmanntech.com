import { NextResponse } from "next/server";
import { draftReply } from "@/lib/admin/ai";
import { adminRoute, readJson, text } from "@/lib/admin/api";
import { getMessage } from "@/lib/admin/inbox";
import { getRules } from "@/lib/admin/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };

export const POST = adminRoute(
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const message = /^\d+$/.test(id) ? await getMessage(id) : null;
    if (!message) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const instruction = text((await readJson(request)).instruction, 2000);
    return NextResponse.json({
      draft: await draftReply(message, instruction, await getRules()),
    });
  },
);
