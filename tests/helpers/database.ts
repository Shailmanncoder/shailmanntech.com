import postgres from "postgres";
import { migrate } from "@/db/migrate.mjs";

/**
 * Creates an empty, fully migrated database for one test file and returns its
 * URL. Needs TEST_DATABASE_URL pointing at a throwaway Postgres server.
 */
export async function freshDatabase(
  label: string,
  { migrated = true }: { migrated?: boolean } = {},
) {
  const base = process.env.TEST_DATABASE_URL!;
  const name = `t_${label}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const admin = postgres(base, { max: 1, onnotice: () => {} });
  await admin.unsafe(`create database ${name}`);
  await admin.end();

  const url = base.replace(/\/[^/?]*(\?|$)/, `/${name}$1`);
  if (migrated) {
    const sql = postgres(url, { max: 1, onnotice: () => {} });
    await migrate(sql, { log: () => {} });
    await sql.end();
  }

  return {
    url,
    async drop() {
      const cleanup = postgres(base, { max: 1, onnotice: () => {} });
      await cleanup.unsafe(`drop database if exists ${name} with (force)`);
      await cleanup.end();
    },
  };
}
