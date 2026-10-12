import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { getProject } from "@/lib/portal/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const GET = adminRoute(
  async (_request: Request, { params }: Context) => {
    const found = await getProject((await params).id, null);
    return found
      ? NextResponse.json(found)
      : NextResponse.json({ error: "Not found." }, { status: 404 });
  },
);
