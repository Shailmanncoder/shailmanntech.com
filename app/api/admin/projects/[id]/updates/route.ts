import { NextResponse } from "next/server";
import { adminRoute, readJson, text } from "@/lib/admin/api";
import { logEvent } from "@/lib/admin/audit";
import { sendProjectUpdate } from "@/lib/portal/email";
import {
  PROJECT_STATUSES,
  getProject,
  markEmailed,
  postTeamUpdate,
  type ProjectStatus,
} from "@/lib/portal/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** Posts an update to the client's project page and emails it to them. */
export const POST = adminRoute(
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const found = await getProject(id, null);
    if (!found)
      return NextResponse.json({ error: "Not found." }, { status: 404 });

    const body = await readJson(request);
    const message = text(body.body, 10_000).trim();
    const status = PROJECT_STATUSES.includes(body.status as ProjectStatus)
      ? (body.status as ProjectStatus)
      : null;
    const progress =
      typeof body.progress === "number" && Number.isInteger(body.progress)
        ? Math.min(100, Math.max(0, body.progress))
        : null;
    if (!message && !status && progress === null) {
      return NextResponse.json(
        { error: "Write an update or change the status." },
        { status: 422 },
      );
    }

    const update = await postTeamUpdate(id, {
      body: message,
      status,
      progress,
    });
    const emailed =
      body.notify === false
        ? false
        : await sendProjectUpdate(found.project, update);
    if (emailed) await markEmailed(update.id);
    await logEvent("project_updated", {
      target: id,
      details: { status: update.status, progress: update.progress, emailed },
    });
    return NextResponse.json({ ...(await getProject(id, null)), emailed });
  },
);
