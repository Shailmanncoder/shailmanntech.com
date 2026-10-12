import { NextResponse } from "next/server";
import { notifyTeamOfClientMessage } from "@/lib/portal/email";
import {
  clientRoute,
  fail,
  limited,
  readBody,
  str,
  tooMany,
} from "@/lib/portal/api";
import { addClientMessage, getProject } from "@/lib/portal/projects";
import { escapeHtml, sendTelegram } from "@/lib/telegram";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** The client writes on their project; the team is emailed (and pinged). */
export const POST = clientRoute(
  async (client, request: Request, { params }: Context) => {
    if (await limited(`portal-msg:${client.id}`, 30, 3600)) return tooMany();
    const found = await getProject((await params).id, client.email);
    if (!found) return fail("Project not found.", 404);
    const body = str((await readBody(request)).body, 5000).trim();
    if (body.length < 2) return fail("Write a message first.");

    await addClientMessage(found.project.id, body);
    await notifyTeamOfClientMessage(found.project, body);
    await sendTelegram(
      `💬 <b>${escapeHtml(found.project.name || client.email)}</b> wrote on <b>${escapeHtml(found.project.title)}</b>\n\n${escapeHtml(body.slice(0, 400))}\n\n<a href="${site.url}/admin">Open in admin →</a>`,
    );
    return NextResponse.json(await getProject(found.project.id, client.email));
  },
);
