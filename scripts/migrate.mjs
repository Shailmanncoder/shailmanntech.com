// Brings the database up to date. Runs as part of `npm run build`, so every
// production deployment migrates before it goes live.
//
// Skipped when DATABASE_URL isn't set (local builds, CI) and on Vercel
// preview builds, so an unreleased branch can never change the production
// database. Set MIGRATE_PREVIEW=true to migrate a preview's own database.
import postgres from "postgres";
import { migrate } from "../db/migrate.mjs";

const url = process.env.DATABASE_URL;
const onVercel = Boolean(process.env.VERCEL);
const environment = process.env.VERCEL_ENV;

if (!url) {
  console.log("Migrations: DATABASE_URL not set, skipping.");
  process.exit(0);
}
if (
  onVercel &&
  environment !== "production" &&
  process.env.MIGRATE_PREVIEW !== "true"
) {
  console.log(`Migrations: skipped on a ${environment} build.`);
  process.exit(0);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  const ran = await migrate(sql);
  console.log(
    ran.length
      ? `Migrations: applied ${ran.length}.`
      : "Migrations: database is up to date.",
  );
} catch (error) {
  console.error("Migrations failed:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
