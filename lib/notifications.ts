import "server-only";
import { adminDbConfigured, db } from "@/lib/admin/db";
import { reportError } from "@/lib/errors";

/**
 * Notifications under the bell, for the admin ("admin") or one client
 * ("client", by email address). The code that creates one also sends the
 * matching email. Saving one never fails the action it describes.
 */

export type NotificationKind =
  | "new_email"
  | "form_request"
  | "new_project"
  | "client_message"
  | "client_signup"
  | "project_update"
  | "reply";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string;
  createdAt: string;
  read: boolean;
};

type Audience = { audience: "admin" } | { audience: "client"; email: string };

export async function notify(
  to: Audience,
  item: { kind: NotificationKind; title: string; body?: string; link?: string },
) {
  if (!adminDbConfigured()) return;
  try {
    const sql = await db();
    await sql`
      insert into notifications (audience, email, kind, title, body, link)
      values (${to.audience}, ${to.audience === "client" ? to.email.toLowerCase() : null},
              ${item.kind}, ${item.title.slice(0, 200)},
              ${(item.body ?? "").replace(/\s+/g, " ").trim().slice(0, 300)},
              ${item.link ?? ""})`;
  } catch (error) {
    await reportError("admin-api", error, { area: "saving a notification" });
  }
}

const whose = (sql: Awaited<ReturnType<typeof db>>, to: Audience) =>
  to.audience === "admin"
    ? sql`audience = 'admin'`
    : sql`audience = 'client' and email = ${to.email.toLowerCase()}`;

/** The latest notifications and how many are unread. */
export async function listNotifications(to: Audience, limit = 30) {
  const sql = await db();
  const rows = await sql<
    {
      id: string;
      kind: NotificationKind;
      title: string;
      body: string;
      link: string;
      created_at: Date;
      read_at: Date | null;
    }[]
  >`
    select id, kind, title, body, link, created_at, read_at from notifications
    where ${whose(sql, to)} order by created_at desc, id desc limit ${limit}`;
  const [{ unread }] = await sql<{ unread: number }[]>`
    select count(*)::int as unread from notifications
    where ${whose(sql, to)} and read_at is null`;
  return {
    unread,
    notifications: rows.map(
      (r): Notification => ({
        id: String(r.id),
        kind: r.kind,
        title: r.title,
        body: r.body,
        link: r.link,
        createdAt: r.created_at.toISOString(),
        read: r.read_at !== null,
      }),
    ),
  };
}

/** Marks one notification, or all of them, as read. */
export async function markRead(to: Audience, id: string | "all") {
  const sql = await db();
  await sql`
    update notifications set read_at = now()
    where ${whose(sql, to)} and read_at is null
    ${id === "all" ? sql`` : sql`and id = ${id}`}`;
}
