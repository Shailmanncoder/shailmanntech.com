import { NextResponse } from "next/server";
import { adminRoute, readJson, text } from "@/lib/admin/api";
import { logEvent } from "@/lib/admin/audit";
import { reportError } from "@/lib/errors";
import { getMessage, sendReply } from "@/lib/admin/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const POST = adminRoute(
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const message = /^\d+$/.test(id) ? await getMessage(id) : null;
    if (!message) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (!message.contactEmail) {
      return NextResponse.json(
        { error: "This email has no address to reply to." },
        { status: 422 },
      );
    }

    const body = text((await readJson(request)).body, 20_000).trim();
    if (body.length < 2) {
      return NextResponse.json(
        { error: "Write a reply first." },
        { status: 422 },
      );
    }

    const result = await sendReply(message, body);
    if (!result.ok) {
      if (result.status === 502) {
        await reportError("reply-send", result.error, { messageId: id });
      }
      return NextResponse.json(
        {
          error:
            result.status === 502
              ? "The email provider didn't accept the reply."
              : result.error,
        },
        { status: result.status },
      );
    }
    await logEvent("reply_sent", {
      target: id,
      details: { to: message.contactEmail, duplicate: result.duplicate },
    });
    return NextResponse.json({
      message: await getMessage(id),
      duplicate: result.duplicate,
    });
  },
);
