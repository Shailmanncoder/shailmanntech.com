import "server-only";
import { db } from "./db";
import { validateLead } from "./workspace-validation";
export async function listLeads() {
  const sql = await db();
  return sql`select email, name, stage, notes, tags, follow_up_at as "followUpAt", updated_at as "updatedAt" from admin_leads order by follow_up_at asc nulls last, updated_at desc`;
}
export async function saveLead(input: Record<string, unknown>) {
  const l = validateLead(input);
  const sql = await db();
  await sql`insert into admin_leads(email,name,stage,notes,tags,follow_up_at) values (${l.email},${l.name},${l.stage},${l.notes},${l.tags},${l.followUpAt}) on conflict(email) do update set name=excluded.name,stage=excluded.stage,notes=excluded.notes,tags=excluded.tags,follow_up_at=excluded.follow_up_at,updated_at=now()`;
  return l;
}
export async function listTemplates() {
  const sql = await db();
  return sql`select id::text, title, body from admin_templates order by title,id`;
}
export async function conversation(email: string, before?: string) {
  const sql = await db();
  return sql`select * from (
 select 'mail-' || id as id, subject, body, direction, received_at as at from admin_messages where lower(contact_email)=${email.toLowerCase()}
 union all
 select 'reply-' || r.id, m.subject, r.body, 'outgoing', r.sent_at from admin_replies r join admin_messages m on m.id=r.message_id where lower(m.contact_email)=${email.toLowerCase()} and r.status='sent'
 ) thread ${before ? sql`where at < ${before}` : sql``} order by at desc, id desc limit 100`;
}
