import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { getStats } from "@/lib/admin/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = adminRoute(async () => NextResponse.json(await getStats()));
