#!/usr/bin/env node
/**
 * Captures a product screenshot at the aspect ratio the showcase frame expects.
 *
 *   npm run capture -- <slug> <url>
 *   npm run capture -- nexusmeet https://nexusmeet.live
 *
 * Writes public/products/<slug>.png, then point the product's `screenshot`
 * field in lib/content.ts at it.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

// 16:11 matches the aspect-16/11 frame in ProductVisuals, at 2x for retina.
const WIDTH = 1440;
const HEIGHT = 990;

const [slug, url] = process.argv.slice(2);

if (!slug || !url) {
  console.error("Usage: npm run capture -- <slug> <url>");
  process.exit(1);
}

const chrome = CHROME_CANDIDATES.find((path) => existsSync(path));
if (!chrome) {
  console.error("No Chrome or Chromium found. Looked in:");
  CHROME_CANDIDATES.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}

const outDir = resolve("public/products");
mkdirSync(outDir, { recursive: true });
const out = resolve(outDir, `${slug}.png`);

console.log(`Capturing ${url} -> public/products/${slug}.png`);

try {
  execFileSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      "--virtual-time-budget=10000",
      `--window-size=${WIDTH},${HEIGHT}`,
      `--screenshot=${out}`,
      url,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
} catch (error) {
  console.error(`Chrome failed: ${error.message}`);
  process.exit(1);
}

if (!existsSync(out)) {
  console.error("Chrome produced no file — is the site reachable?");
  process.exit(1);
}

const kb = Math.round(statSync(out).size / 1024);
console.log(`Done: ${kb}KB at ${WIDTH * 2}x${HEIGHT * 2}`);
console.log(`Now set screenshot in lib/content.ts:`);
console.log(`  screenshot: { src: "/products/${slug}.png", alt: "..." },`);
