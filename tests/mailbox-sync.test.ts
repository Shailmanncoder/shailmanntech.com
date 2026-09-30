import { ImapFlow } from "imapflow";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
  const { syncMailbox } = await import("@/lib/admin/mailbox");

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
    for (const raw of messages) await client.append("INBOX", raw);
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
});
