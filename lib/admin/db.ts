import "server-only";
import postgres from "postgres";

/**
 * Postgres for the admin inbox (Neon in production, any Postgres locally).
 *
 * The schema is managed by versioned migrations in db/migrations, applied by
 * `npm run migrate` (and automatically during production builds). The app
 * never changes the schema itself; it only checks that the database has every
 * migration this code expects.
 */

/** The newest migration this code depends on. Bump it with each migration. */
export const EXPECTED_SCHEMA_VERSION = "0005";

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as {
  adminSql?: Sql;
  adminSchemaReady?: boolean;
};

export class SchemaOutOfDateError extends Error {}

export function adminDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function client(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  globalForDb.adminSql ??= postgres(url, {
    max: 3,
    idle_timeout: 20,
    onnotice: () => {},
  });
  return globalForDb.adminSql;
}

/** The newest migration applied to the database, or null if none. */
export async function appliedSchemaVersion(sql: Sql = client()) {
  const [table] = await sql<{ exists: boolean }[]>`
    select to_regclass('public.schema_migrations') is not null as exists`;
  if (!table.exists) return null;
  const [row] = await sql<{ version: string | null }[]>`
    select max(version) as version from schema_migrations`;
  return row.version;
}

/** Returns a client once the database is known to be migrated. */
export async function db(): Promise<Sql> {
  const sql = client();
  if (!globalForDb.adminSchemaReady) {
    const version = await appliedSchemaVersion(sql);
    if (!version || version < EXPECTED_SCHEMA_VERSION) {
      throw new SchemaOutOfDateError(
        `The database is at migration ${version ?? "none"} but this code needs ${EXPECTED_SCHEMA_VERSION}. Run "npm run migrate" (production builds do this automatically).`,
      );
    }
    globalForDb.adminSchemaReady = true;
  }
  return sql;
}
