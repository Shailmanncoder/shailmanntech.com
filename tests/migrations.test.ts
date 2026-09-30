import { mkdtempSync, readdirSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listMigrations, migrate, MIGRATIONS_DIR } from "@/db/migrate.mjs";
import { EXPECTED_SCHEMA_VERSION } from "@/lib/admin/db";
import { freshDatabase } from "./helpers/database";

describe("migration files", () => {
  it("are numbered without gaps and match what the code expects", () => {
    const versions = listMigrations().map((m) => m.version);
    versions.forEach((version, index) => {
      expect(Number(version)).toBe(index + 1);
    });
    expect(versions.at(-1)).toBe(EXPECTED_SCHEMA_VERSION);
  });
});

describe.skipIf(!process.env.TEST_DATABASE_URL)("migrating a database", () => {
  let database: Awaited<ReturnType<typeof freshDatabase>>;
  let sql: postgres.Sql;

  beforeAll(async () => {
    database = await freshDatabase("migrations");
    sql = postgres(database.url, { max: 1, onnotice: () => {} });
  });

  afterAll(async () => {
    await sql.end();
    await database.drop();
  });

  it("builds every table from scratch", async () => {
    const tables = await sql<{ table_name: string }[]>`
      select table_name from information_schema.tables
      where table_schema = 'public' order by table_name`;
    expect(tables.map((t) => t.table_name)).toEqual(
      expect.arrayContaining([
        "admin_messages",
        "admin_replies",
        "admin_settings",
        "admin_sync_state",
        "rate_limit_hits",
        "schema_migrations",
      ]),
    );
  });

  it("does nothing the second time", async () => {
    expect(await migrate(sql, { log: () => {} })).toEqual([]);
  });

  it("refuses to continue if an applied migration was edited", async () => {
    const dir = mkdtempSync(join(tmpdir(), "migrations-"));
    for (const name of readdirSync(MIGRATIONS_DIR)) {
      copyFileSync(join(MIGRATIONS_DIR, name), join(dir, name));
    }
    writeFileSync(join(dir, "0001_initial.sql"), "select 1; -- edited");
    await expect(migrate(sql, { dir, log: () => {} })).rejects.toThrow(
      /was changed/,
    );
  });

  it("upgrades a database created before migrations existed", async () => {
    const legacy = await freshDatabase("legacy", { migrated: false });
    const old = postgres(legacy.url, { max: 1, onnotice: () => {} });
    try {
      // The state the app used to create on its own: the original tables, no
      // record of migrations, and the old login-attempts table.
      await old.unsafe(listMigrations()[0].text);
      await old`create table admin_login_attempts (ip text, at timestamptz)`;
      await old`
        insert into admin_messages (uidvalidity, uid, received_at, automated,
          automated_reason, classified)
        values (1, 1, now(), true, 'Service or account notice', true),
               (1, 2, now(), true, 'Marked by you', true)`;

      const ran = await migrate(old, { log: () => {} });
      expect(ran).toEqual(listMigrations().map((m) => m.name));

      const rows = await old<{ uid: string; classified: boolean }[]>`
        select uid, classified from admin_messages order by uid`;
      // Domain-only decisions are re-checked; the owner's choice is kept.
      expect(rows.map((r) => r.classified)).toEqual([false, true]);
      const [gone] = await old`select to_regclass('admin_login_attempts') as t`;
      expect(gone.t).toBeNull();
    } finally {
      await old.end();
      await legacy.drop();
    }
  });

  it("makes the app refuse to use a database that isn't migrated", async () => {
    const empty = await freshDatabase("unmigrated", { migrated: false });
    process.env.DATABASE_URL = empty.url;
    const { db, SchemaOutOfDateError } = await import("@/lib/admin/db");
    await expect(db()).rejects.toBeInstanceOf(SchemaOutOfDateError);
    const globals = globalThis as unknown as { adminSql?: postgres.Sql };
    await globals.adminSql?.end();
    await empty.drop();
  });
});
