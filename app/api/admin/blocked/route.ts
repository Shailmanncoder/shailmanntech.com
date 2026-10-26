import { NextResponse } from "next/server";
import { adminRoute, readJson, text } from "@/lib/admin/api";
import { logEvent } from "@/lib/admin/audit";
import { blockSender, listBlocked, unblockSender } from "@/lib/admin/blocked";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = adminRoute(async () =>
  NextResponse.json({ blocked: await listBlocked() }),
);

/** Blocks an address or a domain: { pattern, note? }. */
export const POST = adminRoute(async (request: Request) => {
  const input = await readJson(request);
  const result = await blockSender(text(input.pattern, 254), text(input.note, 300));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }
  await logEvent("sender_blocked", {
    target: result.pattern,
    details: { messages: result.messages },
  });
  return NextResponse.json({
    pattern: result.pattern,
    messages: result.messages,
    blocked: await listBlocked(),
  });
});

/** Unblocks one entry ({ id }) or whatever blocks an address ({ email }). */
export const DELETE = adminRoute(async (request: Request) => {
  const input = await readJson(request);
  const id = String(input.id ?? "");
  const email = text(input.email, 254);
  if (!/^\d+$/.test(id) && !email) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const removed = await unblockSender(/^\d+$/.test(id) ? { id } : { email });
  if (!removed) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  await logEvent("sender_unblocked", {
    target: removed.pattern,
    details: { messages: removed.messages },
  });
  return NextResponse.json({ ...removed, blocked: await listBlocked() });
});
