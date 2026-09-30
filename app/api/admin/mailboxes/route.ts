import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { listMailboxFolders } from "@/lib/admin/mailbox";
export const GET = adminRoute(async () =>
  NextResponse.json({ folders: await listMailboxFolders() }),
);
