import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { downloadAttachment } from "@/lib/admin/mailbox";
export const runtime = "nodejs";
export const GET = adminRoute(
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string; index: string }> },
  ) => {
    const { id, index } = await params;
    if (!/^\d+$/.test(id) || !/^\d+$/.test(index))
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    const attachment = await downloadAttachment(id, Number(index));
    if (!attachment)
      return NextResponse.json(
        { error: "Attachment no longer available in the mailbox." },
        { status: 404 },
      );
    const name = (attachment.filename || "attachment").replace(/[\r\n]/g, "_");
    return new Response(new Uint8Array(attachment.content), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
);
