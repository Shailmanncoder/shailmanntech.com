import { afterAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./helpers/database";

/** "Sign out all devices" against a real Postgres (needs TEST_DATABASE_URL). */
const database = process.env.TEST_DATABASE_URL
  ? await freshDatabase("sessions")
  : null;

describe.skipIf(!database)("signing out all devices", async () => {
  process.env.DATABASE_URL = database?.url;
  process.env.ADMIN_USERNAME = "owner";
  process.env.ADMIN_PASSWORD = "a long enough password";
  const { createSessionValue, revokeAllSessions, sessionActive } =
    await import("@/lib/admin/auth");

  afterAll(async () => {
    const globals = globalThis as unknown as {
      adminSql?: { end(): Promise<void> };
    };
    await globals.adminSql?.end();
    await database?.drop();
  });

  it("ends every existing session and only new sign-ins work", async () => {
    const laptop = (await createSessionValue()).value;
    const phone = (await createSessionValue()).value;
    expect(await sessionActive(laptop)).toBe(true);
    expect(await sessionActive(phone)).toBe(true);

    await revokeAllSessions();
    expect(await sessionActive(laptop)).toBe(false);
    expect(await sessionActive(phone)).toBe(false);

    const fresh = (await createSessionValue()).value;
    expect(await sessionActive(fresh)).toBe(true);

    await revokeAllSessions();
    expect(await sessionActive(fresh)).toBe(false);
  });
});
