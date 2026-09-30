import "server-only";
import { NextResponse } from "next/server";
import { AiUnavailableError } from "./ai";
import { rejectUnlessAdmin } from "./auth";
import { reportError } from "@/lib/errors";
import { SchemaOutOfDateError, adminDbConfigured } from "./db";

/**
 * Wraps an admin API handler: rejects callers who aren't signed in, reports
 * missing configuration clearly, and turns unexpected errors into JSON.
 */
export function adminRoute<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args) => {
    const denied = await rejectUnlessAdmin();
    if (denied) return denied;
    if (!adminDbConfigured()) {
      return NextResponse.json(
        { error: "The database isn't connected yet (DATABASE_URL)." },
        { status: 503 },
      );
    }
    const request = args[0] instanceof Request ? args[0] : null;
    const path = request ? new URL(request.url).pathname : undefined;
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof SchemaOutOfDateError) {
        console.error(error.message);
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      if (error instanceof AiUnavailableError) {
        await reportError("ai", error, { path });
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      await reportError("admin-api", error, { path, method: request?.method });
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Something went wrong.",
        },
        { status: 500 },
      );
    }
  };
}

export async function readJson(request: Request) {
  try {
    return ((await request.json()) ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function text(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : "";
}
