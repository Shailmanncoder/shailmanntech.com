import { validateAttachments } from "@/lib/admin/workspace-validation";
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

    if (Number(request.headers.get("content-length")) > 3_000_000)
      return NextResponse.json(
        { error: "Attachments are too large." },
        { status: 413 },
      );
    const input = await readJson(request);
    let attachments;
    try {
      attachments = validateAttachments(input.attachments);
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 422 },
      );
    }
    const body = text(input.body, 20_000).trim();
    if (body.length < 2) {
      return NextResponse.json(
        { error: "Write a reply first." },
        { status: 422 },
      );
    }

    const result = await sendReply(message, body, attachments);
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
