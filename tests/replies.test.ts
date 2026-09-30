import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { freshDatabase } from "./helpers/database";

/**
 * Reply sending against a real Postgres. Run with a throwaway database:
 *   TEST_DATABASE_URL=postgres://… npm test
 * Skipped when TEST_DATABASE_URL isn't set.
 */

const database = process.env.TEST_DATABASE_URL
  ? await freshDatabase("replies")
  : null;

describe.skipIf(!database)("sending replies", async () => {
  process.env.DATABASE_URL = database?.url;
  process.env.RESEND_API_KEY = "re_test";
  const { db } = await import("@/lib/admin/db");
  const { getMessage, replyKey, sendReply } = await import("@/lib/admin/inbox");

  const resend = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
    async () => Response.json({ id: "email_1" }),
  );
  let messageId = "";

  beforeAll(async () => {
    vi.stubGlobal("fetch", resend);
    const sql = await db();
    const [row] = await sql<{ id: string }[]>`
      insert into admin_messages (uidvalidity, uid, contact_name, contact_email,
        subject, body, received_at, classified)
      values (1, 1, 'Ada', 'ada@example.com', 'Dashboard', 'Hello', now(), true)
      returning id`;
    messageId = String(row.id);
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    const globals = globalThis as unknown as {
      adminSql?: { end(): Promise<void> };
    };
    await globals.adminSql?.end();
    await database?.drop();
  });

  beforeEach(async () => {
    resend.mockClear();
    const sql = await db();
    await sql`delete from admin_replies`;
    await sql`update admin_messages set status = 'read'`;
  });

  const message = async () => (await getMessage(messageId))!;
  const sentKeys = () =>
    resend.mock.calls.map(
      ([, init]) => (init.headers as Record<string, string>)["idempotency-key"],
    );

  it("records the reply, sends it once with an idempotency key, and marks the email replied", async () => {
    const result = await sendReply(await message(), "Thanks, Ada!");
    expect(result).toEqual({ ok: true, duplicate: false });
    expect(sentKeys()).toEqual([
      `reply-${replyKey(messageId, "Thanks, Ada!")}`,
    ]);

    const after = await message();
    expect(after.status).toBe("replied");
    expect(after.replies.map((r) => r.body)).toEqual(["Thanks, Ada!"]);
  });

  it("sends attachments and distinguishes different files on retries", async () => {
    const files = [{ filename: "scope.txt", content: "aGVsbG8=" }];
    await sendReply(await message(), "Attached scope", files);
    expect(
      JSON.parse(String(resend.mock.calls[0][1].body)).attachments,
    ).toEqual(files);
    await sendReply(await message(), "Attached scope", files);
    expect(resend).toHaveBeenCalledTimes(1);
    await sendReply(await message(), "Attached scope", [
      { filename: "scope.txt", content: "bmV3" },
    ]);
    expect(resend).toHaveBeenCalledTimes(2);
    expect(new Set(sentKeys()).size).toBe(2);
  });

  it("never sends the same reply twice", async () => {
    await sendReply(await message(), "Thanks, Ada!");
    const again = await sendReply(await message(), "  Thanks, Ada!  ");
    expect(again).toEqual({ ok: true, duplicate: true });
    expect(resend).toHaveBeenCalledOnce();
    expect((await message()).replies).toHaveLength(1);
  });

  it("refuses a second send while the first is still in flight", async () => {
    const sql = await db();
    await sql`
      insert into admin_replies (message_id, body, status, idempotency_key)
      values (${messageId}, 'Hi', 'sending', ${replyKey(messageId, "Hi")})`;
    const result = await sendReply(await message(), "Hi");
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(resend).not.toHaveBeenCalled();
  });

  it("retries an attempt whose confirmation was lost, under the same key", async () => {
    // Simulates: Resend accepted the email, then saving "sent" failed.
    const sql = await db();
    const key = replyKey(messageId, "Hi");
    await sql`
      insert into admin_replies (message_id, body, status, idempotency_key, sent_at)
      values (${messageId}, 'Hi', 'sending', ${key}, now() - interval '10 minutes')`;
    const result = await sendReply(await message(), "Hi");
    expect(result).toEqual({ ok: true, duplicate: false });
    // Same key as the lost attempt, so Resend drops it if it was delivered.
    expect(sentKeys()).toEqual([`reply-${key}`]);
    expect((await message()).replies).toHaveLength(1);
  });

  it("marks a rejected send as failed and lets it be retried", async () => {
    resend.mockImplementationOnce(
      async () => new Response("nope", { status: 422 }),
    );
    const failed = await sendReply(await message(), "Hi");
    expect(failed).toMatchObject({ ok: false, status: 502 });
    expect((await message()).replies).toHaveLength(0);
    expect((await message()).status).toBe("read");

    const retried = await sendReply(await message(), "Hi");
    expect(retried).toEqual({ ok: true, duplicate: false });
    expect((await message()).replies).toHaveLength(1);
  });
});
