import "server-only";
import { NextResponse } from "next/server";
import { adminDbConfigured } from "@/lib/admin/db";
import { reportError } from "@/lib/errors";
import { allow } from "@/lib/rate-limit";
import { currentClient, type Client } from "./auth";

export function ipOf(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}

export const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

export async function readBody(request: Request) {
  try {
    return ((await request.json()) ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export const str = (value: unknown, max = 500) =>
  typeof value === "string" ? value.slice(0, max) : "";

/** False (and a 429 to return) once a key passes its limit. */
export async function limited(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  return !(await allow(key, limit, windowSeconds));
}

const tooMany = () =>
  fail("Too many attempts. Please wait a few minutes and try again.", 429);
export { tooMany };

/** Wraps a portal route: needs the database, reports unexpected errors. */
export function portalRoute<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args) => {
    if (!adminDbConfigured())
      return fail("The client portal isn't available yet.", 503);
    try {
      return await handler(...args);
    } catch (error) {
      await reportError("admin-api", error, { area: "client portal" });
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}

/** Like portalRoute, but the caller must be signed in; passes the client. */
export function clientRoute<Args extends unknown[]>(
  handler: (client: Client, ...args: Args) => Promise<Response>,
) {
  return portalRoute(async (...args: Args) => {
    const client = await currentClient();
    if (!client) return fail("Please sign in.", 401);
    return handler(client, ...args);
  });
}
