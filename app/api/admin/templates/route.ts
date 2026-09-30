import { NextResponse } from "next/server";
import { adminRoute, readJson, text } from "@/lib/admin/api";
import { db } from "@/lib/admin/db";
import { listTemplates } from "@/lib/admin/workspace";
export const GET = adminRoute(async () =>
  NextResponse.json({ templates: await listTemplates() }),
);
export const PUT = adminRoute(async (request: Request) => {
  const input = await readJson(request);
  const title = text(input.title, 120).trim();
  const body = text(input.body, 10000).trim();
  if (!title || !body)
    return NextResponse.json(
      { error: "Add a title and reply text." },
      { status: 422 },
    );
  const sql = await db();
  if (input.id) {
    if (!/^\d+$/.test(String(input.id)))
      return NextResponse.json({ error: "Invalid template." }, { status: 422 });
    await sql`update admin_templates set title=${title},body=${body},updated_at=now() where id=${String(input.id)}`;
  } else
    await sql`insert into admin_templates(title,body) values(${title},${body})`;
  return NextResponse.json({ templates: await listTemplates() });
});
export const DELETE = adminRoute(async (request: Request) => {
  const input = await readJson(request);
  if (!/^\d+$/.test(String(input.id)))
    return NextResponse.json({ error: "Invalid template." }, { status: 422 });
  const sql = await db();
  await sql`delete from admin_templates where id=${String(input.id)}`;
  return NextResponse.json({ templates: await listTemplates() });
});
