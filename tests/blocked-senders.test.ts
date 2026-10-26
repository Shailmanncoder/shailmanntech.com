import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { checkPattern, matchesPattern } from "@/lib/blocklist";
import { freshDatabase } from "./helpers/database";

const OWN = ["support@shailmanntech.com", "hello@shailmanntech.com"];

describe("block patterns", () => {
  it("accepts an address or a domain, cleaned up", () => {
    expect(checkPattern("  Spammer@Example.com ", OWN)).toEqual({
      ok: true,
      pattern: "spammer@example.com",
      kind: "address",
    });
    expect(checkPattern("mailto:a@b.io", OWN)).toMatchObject({ pattern: "a@b.io" });
    expect(checkPattern("@Example.com", OWN)).toEqual({
      ok: true,
      pattern: "example.com",
      kind: "domain",
    });
  });

  it("refuses nonsense, our own addresses and public mail providers", () => {
    expect(checkPattern("not an email", OWN).ok).toBe(false);
    expect(checkPattern("javascript:alert(1)", OWN).ok).toBe(false);
    expect(checkPattern("support@shailmanntech.com", OWN).ok).toBe(false);
    expect(checkPattern("shailmanntech.com", OWN).ok).toBe(false);
    expect(checkPattern("gmail.com", OWN).ok).toBe(false);
    // A single Gmail address is fine.
    expect(checkPattern("someone@gmail.com", OWN).ok).toBe(true);
  });

  it("matches a domain and its subdomains, but not lookalikes", () => {
    expect(matchesPattern("A@Example.com", "example.com")).toBe(true);
    expect(matchesPattern("a@mail.example.com", "example.com")).toBe(true);
    expect(matchesPattern("a@notexample.com", "example.com")).toBe(false);
    expect(matchesPattern("a@example.com", "b@example.com")).toBe(false);
  });
});

const database = process.env.TEST_DATABASE_URL
  ? await freshDatabase("blocked_senders")
  : null;

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
  headers: async () => new Headers(),
}));

describe.skipIf(!database)("blocking a sender", async () => {
  process.env.DATABASE_URL = database?.url;
  const { db } = await import("@/lib/admin/db");
  const { blockSender, unblockSender, isBlockedSender, listBlocked } =
    await import("@/lib/admin/blocked");
  const { listMessages, getStats } = await import("@/lib/admin/inbox");
  const { clientFromToken } = await import("@/lib/portal/auth");

  beforeAll(async () => {
    const sql = await db();
    await sql`
      insert into admin_messages (uidvalidity, uid, subject, contact_email, from_email, received_at)
      values (1, 1, 'Hello', 'pest@spam.example', 'pest@spam.example', now()),
             (1, 2, 'Again', 'other@mail.spam.example', 'other@mail.spam.example', now()),
             (1, 3, 'Real client', 'ana@client.example', 'ana@client.example', now())`;
    const [client] = await sql<{ id: string }[]>`
      insert into clients (email, name, email_verified_at)
      values ('pest@spam.example', 'Pest', now()) returning id`;
    await sql`
      insert into client_sessions (token_hash, client_id, expires_at)
      values (encode(sha256('pest-token'), 'hex'), ${client.id}, now() + interval '1 day')`;
  });

  afterAll(async () => {
    const globals = globalThis as unknown as { adminSql?: { end(): Promise<void> } };
    await globals.adminSql?.end();
    await database?.drop();
  });

  it("files their mail in Blocked and out of everything else", async () => {
    expect(await clientFromToken("pest-token")).not.toBeNull();

    const result = await blockSender("spam.example", "test");
    expect(result).toMatchObject({ ok: true, pattern: "spam.example", messages: 2 });

    const inbox = await listMessages("all", "");
    expect(inbox.map((m) => m.subject)).toEqual(["Real client"]);
    const blocked = await listMessages("blocked", "");
    expect(blocked).toHaveLength(2);
    expect(blocked.every((m) => m.blocked)).toBe(true);

    const stats = await getStats();
    expect(stats.total).toBe(1);
    expect(stats.counts.blocked).toBe(2);
    expect((await listBlocked())[0]).toMatchObject({ pattern: "spam.example", messages: 2 });
  });

  it("stops them using the website and signs them out of the portal", async () => {
    expect(await isBlockedSender("PEST@spam.example")).toBe(true);
    expect(await isBlockedSender("ana@client.example")).toBe(false);
    expect(await clientFromToken("pest-token")).toBeNull();
  });

  it("files new mail from them as blocked", async () => {
    const sql = await db();
    const [row] = await sql<{ blocked: boolean }[]>`
      insert into admin_messages (uidvalidity, uid, subject, contact_email, received_at, blocked)
      values (1, 4, 'New one', 'new@spam.example', now(), is_blocked_sender('new@spam.example'))
      returning blocked`;
    expect(row.blocked).toBe(true);
  });

  it("puts their mail back when unblocked", async () => {
    const removed = await unblockSender({ email: "pest@spam.example" });
    expect(removed).toMatchObject({ pattern: "spam.example", messages: 3 });
    expect(await listMessages("blocked", "")).toHaveLength(0);
    expect(await listMessages("all", "")).toHaveLength(4);
    expect(await isBlockedSender("pest@spam.example")).toBe(false);
  });
});
