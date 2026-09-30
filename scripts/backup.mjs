// Downloads a full copy of the database and proves it can be restored.
//
//   BACKUP_DATABASE_URL="postgres://…" npm run backup
//
// Copy the connection string from Neon (Dashboard → Connect). Needs Docker
// Desktop running; the Postgres tools run in a container, so nothing else has
// to be installed. The backup lands in backups/, which is never committed —
// it contains customer emails.
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const source = process.env.BACKUP_DATABASE_URL;
if (!source) {
  console.error(
    'Set BACKUP_DATABASE_URL to the database\'s connection string, e.g.\n  BACKUP_DATABASE_URL="postgres://…" npm run backup',
  );
  process.exit(1);
}

const IMAGE = "postgres:17-alpine"; // pg_dump must be at least the server's version
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const dir = resolve("backups");
const file = `shailmanntech-${stamp}.dump`;
mkdirSync(dir, { recursive: true });

function docker(args, { input, quiet } = {}) {
  const result = spawnSync("docker", args, {
    input,
    encoding: "utf8",
    stdio: quiet ? "pipe" : ["pipe", "pipe", "inherit"],
  });
  if (result.status !== 0) {
    throw new Error(
      `docker ${args[0]} failed${result.stderr ? `: ${result.stderr}` : ""}`,
    );
  }
  return result.stdout;
}

// Row counts per table, read from any database the container can reach.
function rowCounts(runArgs, connection) {
  const query = `
    select format('%s=%s', table_name,
      (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I', table_name), false, true, '')))[1])
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name`;
  const out = docker([...runArgs, "psql", ...connection, "-At", "-c", query], {
    quiet: true,
  });
  return Object.fromEntries(
    out
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => line.split("=")),
  );
}

const scratch = `backup-verify-${process.pid}`;
try {
  console.log(`1/3 Downloading the database to backups/${file}`);
  docker([
    "run",
    "--rm",
    "--network",
    "host",
    "-v",
    `${dir}:/backups`,
    IMAGE,
    "pg_dump",
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    `--file=/backups/${file}`,
    source,
  ]);
  console.log(
    `    ${(statSync(resolve(dir, file)).size / 1024).toFixed(0)} KB`,
  );

  console.log("2/3 Restoring it into a temporary database");
  docker(
    [
      "run",
      "-d",
      "--rm",
      "--name",
      scratch,
      "-e",
      "POSTGRES_PASSWORD=verify",
      IMAGE,
    ],
    { quiet: true },
  );
  for (let i = 0; i < 30; i++) {
    const ready = spawnSync("docker", [
      "exec",
      scratch,
      "pg_isready",
      "-U",
      "postgres",
    ]);
    if (ready.status === 0) break;
    spawnSync("sleep", ["1"]);
  }
  spawnSync("sleep", ["2"]);
  docker(["cp", resolve(dir, file), `${scratch}:/tmp/restore.dump`], {
    quiet: true,
  });
  docker([
    "exec",
    scratch,
    "pg_restore",
    "--no-owner",
    "--no-privileges",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "/tmp/restore.dump",
  ]);

  console.log("3/3 Comparing every table");
  const original = rowCounts(
    ["run", "--rm", "--network", "host", IMAGE],
    ["-d", source],
  );
  const restored = rowCounts(
    ["exec", scratch],
    ["-U", "postgres", "-d", "postgres"],
  );
  const tables = [
    ...new Set([...Object.keys(original), ...Object.keys(restored)]),
  ].sort();
  let ok = tables.length > 0;
  for (const table of tables) {
    const same = original[table] === restored[table];
    ok &&= same;
    console.log(
      `    ${same ? "✔" : "✖"} ${table.padEnd(22)} ${original[table] ?? "missing"} → ${restored[table] ?? "missing"}`,
    );
  }
  if (!ok) throw new Error("The restored copy doesn't match the original.");
  console.log(`\nBackup verified: backups/${file}`);
} catch (error) {
  console.error(`\n✖ ${error.message}`);
  process.exitCode = 1;
} finally {
  spawnSync("docker", ["rm", "-f", scratch], { stdio: "ignore" });
}
