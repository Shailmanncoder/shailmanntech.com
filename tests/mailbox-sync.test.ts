import { ImapFlow } from "imapflow";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { freshDatabase } from "./helpers/database";

/**
 * Mailbox sync against a real IMAP server and Postgres. Needs TEST_IMAP_HOST
 * (and friends, see .github/workflows/ci.yml) plus TEST_DATABASE_URL.
 */
const env = process.env;
const ready = Boolean(env.TEST_IMAP_HOST && env.TEST_DATABASE_URL);
const database = ready ? await freshDatabase("mailbox") : null;

function imap() {
  return new ImapFlow({
    host: env.TEST_IMAP_HOST!,
    port: Number(env.TEST_IMAP_PORT ?? 3993),
    secure: true,
    tls: { rejectUnauthorized: false },
    auth: { user: env.TEST_IMAP_USER!, pass: env.TEST_IMAP_PASSWORD! },
    logger: false,
  });
}

function email(
  from: string,
  subject: string,
  extra: Record<string, string> = {},
) {
  const headers = {
    From: from,
    To: "support@shailmanntech.test",
    Subject: subject,
    Date: new Date().toUTCString(),
    "Message-ID": `<${Math.random().toString(36).slice(2)}@test>`,
    ...extra,
  };
  return (
    Object.entries(headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\r\n") + `\r\n\r\nHello,\r\n\r\n${subject}\r\n`
  );
}

describe.skipIf(!ready)("mailbox sync", async () => {
  Object.assign(process.env, {
    DATABASE_URL: database?.url,
    IMAP_HOST: env.TEST_IMAP_HOST,
    IMAP_PORT: env.TEST_IMAP_PORT ?? "3993",
    IMAP_USER: env.TEST_IMAP_USER,
    IMAP_PASSWORD: env.TEST_IMAP_PASSWORD,
    IMAP_ALLOW_SELF_SIGNED: "true",
    CONTACT_FROM_EMAIL: "Shailmann Tech <hello@shailmanntech.com>",
  });
  const { db } = await import("@/lib/admin/db");
  const { syncMailbox, listMailboxFolders, downloadAttachment } =
    await import("@/lib/admin/mailbox");
  const { checkNewInboxLeads } = await import("@/lib/admin/leads");

  // Ana's form request was checked when she submitted it (see beforeAll).
  beforeAll(async () => {
    const sql = await db();
    await sql`
      insert into contact_submissions (dedupe_key, name, email, service, payload,
        status, fit, fit_reason, smart_draft, alerted_at)
      values ('k-ana', 'Ana', 'ana@example.net', 'React Development', '{}',
        'sent', 'yes', 'Fits React work', 'Dear Ana, …', now())`;
  });

  beforeAll(async () => {
    const client = imap();
    await client.connect();
    // Start from an empty inbox so reruns are predictable.
    const lock = await client.getMailboxLock("INBOX");
    try {
      await client.messageDelete("1:*").catch(() => {});
    } finally {
      lock.release();
    }
    const messages = [
      email(
        '"Priya Sharma" <priya@example.com>',
        "Can you help with our website?",
      ),
      email(
        '"Ana via Shailmann Tech" <hello@shailmanntech.com>',
        "Project request — React Development",
        {
          "Reply-To": "ana@example.net",
        },
      ),
      email('"GoDaddy" <renewals@godaddy.com>', "Your plan expires soon"),
      email('"Weekly" <editor@news.example>', "This week in tech", {
        "List-Unsubscribe": "<mailto:u@news.example>",
      }),
    ];
    for (let i = 0; i < 26; i++) {
      messages.push(
        email(`"Person ${i}" <person${i}@example.com>`, `Question ${i}`),
      );
    }
    for (const raw of messages)
      await client.append(
        "INBOX",
        raw,
        undefined,
        new Date("2020-01-01T12:00:00Z"),
      );
    await client.logout();
  });

  afterAll(async () => {
    const globals = globalThis as unknown as {
      adminSql?: { end(): Promise<void> };
    };
    await globals.adminSql?.end();
    await database?.drop();
  });

  it("imports in batches until the mailbox is caught up", async () => {
    const first = await syncMailbox();
    expect(first.imported).toBe(25);
    expect(first.remaining).toBe(5);
    const second = await syncMailbox();
    expect(second.imported).toBe(5);
    expect(second.remaining).toBe(0);
    const again = await syncMailbox();
    expect(again).toMatchObject({ imported: 0, remaining: 0 });
  });

  it("files each email correctly", async () => {
    const sql = await db();
    const rows = await sql<
      {
        subject: string;
        source: string;
        contact_email: string;
        automated: boolean;
      }[]
    >`select subject, source, contact_email, automated from admin_messages order by uid limit 4`;
    expect(rows).toEqual([
      {
        subject: "Can you help with our website?",
        source: "email",
        contact_email: "priya@example.com",
        automated: false,
      },
      {
        subject: "Project request — React Development",
        source: "form",
        contact_email: "ana@example.net",
        automated: false,
      },
      {
        subject: "Your plan expires soon",
        source: "email",
        contact_email: "renewals@godaddy.com",
        automated: true,
      },
      {
        subject: "This week in tech",
        source: "email",
        contact_email: "editor@news.example",
        automated: true,
      },
    ]);
  });

  it("never changes the mailbox (nothing marked read)", async () => {
    const client = imap();
    await client.connect();
    const lock = await client.getMailboxLock("INBOX", { readOnly: true });
    try {
      const seen = (await client.search({ seen: true }, { uid: true })) || [];
      expect(seen).toEqual([]);
      expect(client.mailbox && client.mailbox.exists).toBe(30);
    } finally {
      lock.release();
      await client.logout();
    }
  });

  it("picks up only new mail on the next sync", async () => {
    const client = imap();
    await client.connect();
    await client.append(
      "INBOX",
      email('"Late" <late@example.com>', "One more thing"),
    );
    await client.logout();
    expect(await syncMailbox()).toMatchObject({ imported: 1, remaining: 0 });
  });
  it("syncs Sent independently and downloads attachments without marking mail read", async () => {
    const client = imap();
    await client.connect();
    await client.mailboxCreate("Sent").catch(() => {});
    const lock = await client.getMailboxLock("Sent");
    try {
      await client.messageDelete("1:*").catch(() => {});
    } finally {
      lock.release();
    }
    await client.append(
      "Sent",
      'From: support@shailmanntech.test\r\nTo: client@example.com\r\nSubject: Scope attached\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="abc"\r\n\r\n--abc\r\nContent-Type: text/plain\r\n\r\nAttached\r\n--abc\r\nContent-Type: text/plain\r\nContent-Disposition: attachment; filename="scope.txt"\r\nContent-Transfer-Encoding: base64\r\n\r\naGVsbG8=\r\n--abc--',
    );
    await client.logout();
    expect((await listMailboxFolders()).some((f) => f.path === "Sent")).toBe(
      true,
    );
    expect((await syncMailbox("Sent")).imported).toBe(1);
    const sql = await db();
    const [row] = await sql`select * from admin_messages where mailbox='Sent'`;
    expect(row.contact_email).toBe("client@example.com");
    expect(row.status).toBe("replied");
    expect(row.direction).toBe("outgoing");
    expect(row.attachments).toHaveLength(1);
    const attachment = await downloadAttachment(String(row.id), 0);
    expect(attachment?.content.toString()).toBe("hello");
    expect((await syncMailbox("Sent")).imported).toBe(0);
  });

  it("gives a form request the fit check done when it was submitted", async () => {
    const sql = await db();
    const [row] = await sql`
      select fit, fit_reason, smart_draft, alerted_at from admin_messages
      where source = 'form' and contact_email = 'ana@example.net'`;
    expect(row).toMatchObject({
      fit: "yes",
      fit_reason: "Fits React work",
      smart_draft: "Dear Ana, …",
    });
    expect(row.alerted_at).not.toBeNull();
  });

  it("alerts about new emails from people in batches, each only once", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123:abc";
    process.env.TELEGRAM_CHAT_ID = "42";
    const texts: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        texts.push(JSON.parse(String(init.body)).text);
        return Response.json({ ok: true });
      }),
    );
    try {
      expect(await checkNewInboxLeads(5)).toBe(5);
      expect(await checkNewInboxLeads(5)).toBe(5);
      let more: number;
      do more = await checkNewInboxLeads(50);
      while (more > 0);

      // Every person's email exactly once; no form requests, no automated mail.
      expect(new Set(texts).size).toBe(texts.length);
      expect(texts.some((t) => t.includes("Priya Sharma"))).toBe(true);
      expect(texts.some((t) => t.includes("ana@example.net"))).toBe(false);
      expect(texts.some((t) => t.includes("godaddy"))).toBe(false);
      expect(await checkNewInboxLeads(50)).toBe(0);
    } finally {
      vi.unstubAllGlobals();
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;
    }
  });
});
