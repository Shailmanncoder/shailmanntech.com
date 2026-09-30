import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { getMessage } from "@/lib/admin/inbox";
import { conversation } from "@/lib/admin/workspace";
export const GET = adminRoute(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    const message = /^\d+$/.test(id) ? await getMessage(id) : null;
    if (!message)
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({
      items: await conversation(message.contactEmail),
    });
  },
);
