import { NextResponse } from "next/server";
import { clientRoute, fail } from "@/lib/portal/api";
import { getProject } from "@/lib/portal/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const GET = clientRoute(
  async (client, _request: Request, { params }: Context) => {
    const found = await getProject((await params).id, client.email);
    return found ? NextResponse.json(found) : fail("Project not found.", 404);
  },
);
