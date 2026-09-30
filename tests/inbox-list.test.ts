import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./helpers/database";

const database = process.env.TEST_DATABASE_URL ? await freshDatabase("inbox_list") : null;

describe.skipIf(!database)("all email history", async () => {
  process.env.DATABASE_URL = database?.url;
  const { db } = await import("@/lib/admin/db");
  const { listMessages } = await import("@/lib/admin/inbox");
  beforeAll(async () => {
    const sql = await db();
    await sql`insert into admin_messages (uidvalidity, uid, subject, received_at, automated, archived)
      select 1, n, 'Older message ' || n, timestamp '2020-01-01', n % 2 = 0, n % 3 = 0
      from generate_series(1, 205) n`;
  });
  afterAll(async () => {
    const globals = globalThis as unknown as { adminSql?: { end(): Promise<void> } };
    await globals.adminSql?.end();
    await database?.drop();
  });
  it("includes old, automated and archived mail and pages beyond 200", async () => {
    const first = await listMessages("all", "");
    const next = await listMessages("all", "", 200);
    expect(first).toHaveLength(201);
    expect(next).toHaveLength(5);
    const visible = [...first.slice(0, 200), ...next];
    expect(new Set(visible.map(m => m.id)).size).toBe(205);
    expect(visible.some(m => m.automated)).toBe(true);
    expect(visible.some(m => m.archived)).toBe(true);
  });
  it("keeps search and specialized filters available", async () => {
    expect(await listMessages("all", "Older message 205")).toHaveLength(1);
    const automated = await listMessages("automated", "");
    expect(automated.length).toBeGreaterThan(0);
    expect(automated.every(m => m.automated)).toBe(true);
  });
});
