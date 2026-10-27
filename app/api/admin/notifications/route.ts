import { NextResponse } from "next/server";
import { adminRoute, readJson } from "@/lib/admin/api";
import { listNotifications, markRead } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN = { audience: "admin" } as const;

export const GET = adminRoute(async () =>
  NextResponse.json(await listNotifications(ADMIN)),
);

/** Marks notifications read: { id } for one, { id: "all" } for all. */
export const POST = adminRoute(async (request: Request) => {
  const id = String((await readJson(request)).id ?? "");
  if (id !== "all" && !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  await markRead(ADMIN, id);
  return NextResponse.json(await listNotifications(ADMIN));
});
