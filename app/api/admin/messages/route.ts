import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { listMessages, type InboxFilter } from "@/lib/admin/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILTERS: InboxFilter[] = [
  "all",
  "awaiting",
  "form",
  "starred",
  "replied",
  "archived",
  "automated",
];

export const GET = adminRoute(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const requested = params.get("filter") as InboxFilter;
  const filter = FILTERS.includes(requested) ? requested : "all";
  const search = (params.get("search") ?? "").slice(0, 200);
  const value = Number(params.get("offset") ?? 0);
  const offset = Number.isSafeInteger(value) && value >= 0 ? value : 0;
  const rows = await listMessages(filter, search, offset, (params.get("mailbox") ?? "").slice(0,255));
  return NextResponse.json({ messages: rows.slice(0, 200), hasMore: rows.length > 200 });
});
