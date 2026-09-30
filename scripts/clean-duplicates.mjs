// iCloud Drive syncs this folder and leaves copies like "routes.d 2.ts" in the
// build output. TypeScript then sees every type twice and fails. This removes
// such copies from .next only, and only when the original file still exists.
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const root = ".next";
const copy = /^(.*) \d+(\.[^/]*)?$/;
let removed = 0;

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const match = name.match(copy);
    if (match && existsSync(join(dir, match[1] + (match[2] ?? "")))) {
      rmSync(path, { recursive: true, force: true });
      removed++;
      continue;
    }
    if (statSync(path).isDirectory()) walk(path);
  }
}

walk(root);
if (removed)
  console.log(`Removed ${removed} iCloud duplicate(s) from ${root}/`);
