// Applies db/migrations/*.sql in filename order, each exactly once, inside a
// single transaction, recording what ran in schema_migrations. A Postgres
// advisory lock stops two deployments from migrating at the same time, and a
// checksum catches a migration that was edited after it ran.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "migrations",
);
const LOCK_ID = 7_413_562_001;

export function listMigrations(dir = MIGRATIONS_DIR) {
  return readdirSync(dir)
    .filter((name) => /^\d{4}_[\w-]+\.sql$/.test(name))
    .sort()
    .map((name) => {
      const text = readFileSync(join(dir, name), "utf8");
      return {
        version: name.slice(0, 4),
        name,
        text,
        checksum: createHash("sha256").update(text).digest("hex"),
      };
    });
}

/** Runs pending migrations. Returns the names applied this time. */
export async function migrate(
  sql,
  { dir = MIGRATIONS_DIR, log = console.log } = {},
) {
  await sql`
    create table if not exists schema_migrations (
      version text primary key,
      name text not null,
      checksum text not null,
      applied_at timestamptz not null default now()
    )`;

  // One transaction for the whole run: if any migration fails, none of them
  // apply. The transaction-scoped advisory lock makes a second deployment
  // wait for this one, then find nothing left to do.
  return sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${LOCK_ID})`;
    const applied = new Map(
      (await tx`select version, name, checksum from schema_migrations`).map(
        (row) => [row.version, row],
      ),
    );
    const ran = [];
    for (const migration of listMigrations(dir)) {
      const done = applied.get(migration.version);
      if (done) {
        if (done.checksum !== migration.checksum) {
          throw new Error(
            `Migration ${migration.name} was changed after it ran. Add a new migration instead of editing an applied one.`,
          );
        }
        continue;
      }
      log(`Applying ${migration.name}`);
      await tx.unsafe(migration.text);
      await tx`
        insert into schema_migrations (version, name, checksum)
        values (${migration.version}, ${migration.name}, ${migration.checksum})`;
      ran.push(migration.name);
    }
    return ran;
  });
}
