import type { Sql } from "postgres";

export const MIGRATIONS_DIR: string;
export function listMigrations(dir?: string): {
  version: string;
  name: string;
  text: string;
  checksum: string;
}[];
export function migrate(
  sql: Sql,
  options?: { dir?: string; log?: (message: string) => void },
): Promise<string[]>;
