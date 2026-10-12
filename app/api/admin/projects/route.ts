import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { allProjects } from "@/lib/portal/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = adminRoute(async () =>
  NextResponse.json({ projects: await allProjects() }),
);
