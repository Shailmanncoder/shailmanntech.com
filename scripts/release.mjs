// One command for a safe production release: every check must pass before
// anything is deployed.
//   npm run release          check, then deploy to production
//   npm run check            check only
import { spawnSync } from "node:child_process";

const deploy = process.argv.includes("--deploy");

const steps = [
  ["Lint", "npm", ["run", "lint", "--", "--max-warnings=0"]],
  ["Type check", "npm", ["run", "typecheck"]],
  ["Tests", "npm", ["test"]],
  ["Production build", "npm", ["run", "build"]],
];

function run(label, command, args) {
  console.log(`\n▶ ${label}`);
  const started = Date.now();
  const result = spawnSync(command, args, { stdio: "inherit" });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  if (result.status !== 0) {
    console.error(
      `\n✖ ${label} failed after ${seconds}s. Nothing was deployed.`,
    );
    process.exit(result.status ?? 1);
  }
  console.log(`✔ ${label} (${seconds}s)`);
}

for (const [label, command, args] of steps) run(label, command, args);

if (!deploy) {
  console.log("\nAll checks passed.");
  process.exit(0);
}

const status = spawnSync("git", ["status", "--porcelain"], {
  encoding: "utf8",
});
if (status.stdout?.trim()) {
  console.warn(
    "\n⚠ Deploying uncommitted changes. Commit them so GitHub matches the live site.",
  );
}

run("Deploy to production", "vercel", ["--prod"]);
console.log("\nReleased.");
