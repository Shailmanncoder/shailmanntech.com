import { NextResponse } from "next/server";
import { listNotifications, markRead } from "@/lib/notifications";
import { clientRoute, fail, readBody } from "@/lib/portal/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = clientRoute(async (client) =>
  NextResponse.json(
    await listNotifications({ audience: "client", email: client.email }),
  ),
);

/** Marks notifications read: { id } for one, { id: "all" } for all. */
export const POST = clientRoute(async (client, request: Request) => {
  const id = String((await readBody(request)).id ?? "");
  if (id !== "all" && !/^\d+$/.test(id)) return fail("Not found.", 404);
  const to = { audience: "client" as const, email: client.email };
  await markRead(to, id);
  return NextResponse.json(await listNotifications(to));
});
