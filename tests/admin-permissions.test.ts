import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Every admin API route must refuse a caller without a valid session. The
 * routes are discovered from the filesystem, so a new route is covered
 * automatically — and fails this test if it forgets adminRoute().
 */

let cookieValue: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "smt_admin" && cookieValue
        ? { name, value: cookieValue }
        : undefined,
  }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.50" }),
}));

const ADMIN_API = join(process.cwd(), "app/api/admin");
/** Routes that must work without a session. */
const PUBLIC = new Set(["login/route.ts", "logout/route.ts"]);
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return routeFiles(path);
    return name === "route.ts" ? [path] : [];
  });
}

const routes = routeFiles(ADMIN_API)
  .map((file) => relative(ADMIN_API, file))
  .filter((file) => !PUBLIC.has(file));

type Handler = (request: Request, context: unknown) => Promise<Response>;

async function callAll(file: string) {
  const mod = (await import(join(ADMIN_API, file))) as Record<string, Handler>;
  const methods = METHODS.filter((m) => typeof mod[m] === "function");
  const statuses: Record<string, number> = {};
  for (const method of methods) {
    const request = new Request(`http://localhost/api/admin/${file}`, {
      method,
      headers: { "content-type": "application/json" },
      body: method === "GET" ? undefined : "{}",
    });
    const response = await mod[method](request, {
      params: Promise.resolve({ id: "1" }),
    });
    statuses[method] = response.status;
  }
  return statuses;
}

beforeEach(() => {
  process.env.ADMIN_USERNAME = "owner";
  process.env.ADMIN_PASSWORD = "a long enough password";
  delete process.env.DATABASE_URL;
  cookieValue = undefined;
});

describe("admin API permissions", () => {
  it("finds the admin routes", () => {
    expect(routes.length).toBeGreaterThanOrEqual(14);
  });

  it.each(routes)("%s refuses a caller without a session", async (file) => {
    const statuses = await callAll(file);
    expect(Object.keys(statuses).length).toBeGreaterThan(0);
    for (const status of Object.values(statuses)) expect(status).toBe(401);
  });

  it.each(routes)("%s refuses a forged session", async (file) => {
    cookieValue = `0.${Date.now() + 60_000}.forged-signature`;
    for (const status of Object.values(await callAll(file)))
      expect(status).toBe(401);
  });

  it("lets a signed-in admin through (then reports the missing database)", async () => {
    const { createSessionValue } = await import("@/lib/admin/auth");
    cookieValue = (await createSessionValue()).value;
    const statuses = await callAll("stats/route.ts");
    expect(statuses.GET).toBe(503);
  });
});
