import "server-only";
import { inboxAddress } from "@/lib/contact-delivery";
import { configIssues } from "@/lib/config";
import { aiConfigured, checkAiConnection } from "./ai";
import {
  EXPECTED_SCHEMA_VERSION,
  adminDbConfigured,
  appliedSchemaVersion,
  db,
} from "./db";
import { connect, mailboxConfigured } from "./mailbox";

/**
 * Live checks of everything the site depends on. Each uses a free, read-only
 * request — no email is sent and no AI tokens are used — and gives up after
 * eight seconds so one slow service can't hang the page.
 */

export type HealthStatus = "ok" | "warning" | "down" | "off";

export type HealthCheck = {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
  ms?: number;
};

const TIMEOUT_MS = 8000;

/** Error text fit for the page: no HTML error pages, no walls of text. */
function readable(error: unknown) {
  const raw = error instanceof Error ? error.message : "Check failed";
  const text = raw
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 160 ? `${text.slice(0, 157)}…` : text || "Check failed";
}

async function timed(
  id: string,
  label: string,
  run: () => Promise<Omit<HealthCheck, "id" | "label" | "ms">>,
): Promise<HealthCheck> {
  const started = Date.now();
  try {
    const result = await Promise.race([
      run(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`No answer after ${TIMEOUT_MS / 1000}s`)),
          TIMEOUT_MS,
        ),
      ),
    ]);
    return { id, label, ...result, ms: Date.now() - started };
  } catch (error) {
    return {
      id,
      label,
      status: "down",
      detail: readable(error),
      ms: Date.now() - started,
    };
  }
}

const off = (detail: string) => ({ status: "off" as const, detail });

function checkDatabase() {
  return timed("database", "Database", async () => {
    if (!adminDbConfigured()) return off("DATABASE_URL isn't set.");
    const version = await appliedSchemaVersion();
    if (!version || version < EXPECTED_SCHEMA_VERSION) {
      return {
        status: "down",
        detail: `Needs migrating: at ${version ?? "none"}, code expects ${EXPECTED_SCHEMA_VERSION}.`,
      };
    }
    return { status: "ok", detail: `Connected · migration ${version}` };
  });
}

function checkMailbox() {
  return timed("mailbox", "Mailbox (IMAP)", async () => {
    if (!mailboxConfigured())
      return off("IMAP_USER / IMAP_PASSWORD aren't set.");
    const client = await connect();
    await client.logout().catch(() => {});
    let synced = "never synced";
    if (adminDbConfigured()) {
      const sql = await db();
      const [row] = await sql<{ synced_at: Date }[]>`
        select synced_at from admin_sync_state limit 1`;
      if (row) {
        const hours = (Date.now() - row.synced_at.getTime()) / 3_600_000;
        synced =
          hours < 1
            ? "synced within the hour"
            : `last synced ${Math.round(hours)} h ago`;
      }
    }
    return {
      status: "ok",
      detail: `Signed in to ${inboxAddress()} · ${synced}`,
    };
  });
}

function checkAi() {
  return timed("ai", "AI (OpenAI)", async () => {
    if (!aiConfigured()) return off("OPENAI_API_KEY isn't set.");
    const model = await checkAiConnection();
    return { status: "ok", detail: `Key works · model ${model}` };
  });
}

function checkEmail() {
  return timed("email", "Sending email (Resend)", async () => {
    const key = process.env.RESEND_API_KEY;
    if (!key)
      return off(
        "RESEND_API_KEY isn't set — replies and form emails can't be sent.",
      );
    const response = await fetch("https://api.resend.com/domains", {
      headers: { authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => ({}))) as {
      name?: string;
      data?: { name: string; status: string }[];
    };
    if (response.status === 401 && body.name === "restricted_api_key") {
      // A send-only key can't list domains, which is the safer setup.
      return { status: "ok", detail: "Key works (send-only)" };
    }
    if (!response.ok) {
      return {
        status: "down",
        detail: `Resend refused the key (${response.status})`,
      };
    }
    const domains = body.data ?? [];
    const unverified = domains
      .filter((d) => d.status !== "verified")
      .map((d) => d.name);
    if (unverified.length) {
      return {
        status: "warning",
        detail: `Not verified: ${unverified.join(", ")}`,
      };
    }
    return {
      status: "ok",
      detail: domains.length
        ? `Key works · ${domains.map((d) => d.name).join(", ")} verified`
        : "Key works",
    };
  });
}

function checkConfig() {
  return timed("config", "Security settings", async () => {
    const issues = configIssues();
    if (issues.length === 0)
      return { status: "ok", detail: "All required settings are in place." };
    return {
      status: issues.some((i) => i.severity === "error") ? "down" : "warning",
      detail: issues.map((i) => i.message).join(" "),
    };
  });
}

export async function runHealthChecks() {
  return Promise.all([
    checkDatabase(),
    checkMailbox(),
    checkEmail(),
    checkAi(),
    checkConfig(),
  ]);
}
