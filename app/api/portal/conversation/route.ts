import { NextResponse } from "next/server";
import { db } from "@/lib/admin/db";
import { clientRoute } from "@/lib/portal/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The client's email history with us: what they sent to the inbox and the
 * replies we sent from the admin, newest first.
 */
export const GET = clientRoute(async (client) => {
  const sql = await db();
  const rows = await sql<
    { kind: "them" | "us"; subject: string; body: string; at: Date }[]
  >`
    select * from (
      select 'them' as kind, subject, body, received_at as at
      from admin_messages
      where contact_email = ${client.email} and direction = 'incoming' and not automated
      union all
      select 'us' as kind, m.subject, r.body, r.sent_at as at
      from admin_replies r join admin_messages m on m.id = r.message_id
      where m.contact_email = ${client.email} and r.status = 'sent'
    ) all_mail
    order by at desc limit 100`;
  return NextResponse.json({
    messages: rows.map((r) => ({
      from: r.kind,
      subject: r.subject,
      body: r.body.slice(0, 20_000),
      at: r.at.toISOString(),
    })),
  });
});
