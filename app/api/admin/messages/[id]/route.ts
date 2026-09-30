import { NextResponse } from "next/server";
import { adminRoute, readJson } from "@/lib/admin/api";
import { logEvent } from "@/lib/admin/audit";
import {
  getMessage,
  updateMessage,
  type MessageStatus,
} from "@/lib/admin/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const STATUSES: MessageStatus[] = ["new", "read", "replied"];

export const GET = adminRoute(
  async (_request: Request, { params }: Context) => {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const message = await getMessage(id);
    if (!message) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    // Opening a new message marks it read.
    if (message.status === "new") {
      await updateMessage(id, { status: "read" });
      message.status = "read";
    }
    return NextResponse.json({ message });
  },
);

export const PATCH = adminRoute(
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const body = await readJson(request);
    const changes = {
      status: STATUSES.includes(body.status as MessageStatus)
        ? (body.status as MessageStatus)
        : undefined,
      archived: typeof body.archived === "boolean" ? body.archived : undefined,
      starred: typeof body.starred === "boolean" ? body.starred : undefined,
      automated:
        typeof body.automated === "boolean" ? body.automated : undefined,
    };
    await updateMessage(id, changes);
    await logEvent("message_updated", { target: id, details: changes });
    return NextResponse.json({ ok: true });
  },
);
