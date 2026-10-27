import { NextResponse } from "next/server";
import { adminRoute, readJson, text } from "@/lib/admin/api";
import { logEvent } from "@/lib/admin/audit";
import { notify } from "@/lib/notifications";
import { sendProjectUpdate } from "@/lib/portal/email";
import {
  PROJECT_STATUSES,
  STATUS_LABELS,
  getProject,
  markEmailed,
  postTeamUpdate,
  type ProjectStatus,
} from "@/lib/portal/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/**
 * Posts an update to the client's project page; the client is emailed and
 * sees it under their bell.
 */
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
    const emailed = await sendProjectUpdate(found.project, update);
    if (emailed) await markEmailed(update.id);
    const changes = [
      update.status ? `Status: ${STATUS_LABELS[update.status]}` : "",
      update.progress !== null ? `Progress: ${update.progress}%` : "",
    ].filter(Boolean);
    await notify(
      { audience: "client", email: found.project.email },
      {
        kind: "project_update",
        title: `Update on ${found.project.title}`,
        body: [...changes, update.body].filter(Boolean).join(" · "),
        link: `/dashboard/projects/${id}`,
      },
    );
    await logEvent("project_updated", {
      target: id,
      details: { status: update.status, progress: update.progress, emailed },
    });
    return NextResponse.json({ ...(await getProject(id, null)), emailed });
  },
);
