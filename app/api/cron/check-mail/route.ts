import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { adminDbConfigured } from "@/lib/admin/db";
import { checkNewInboxLeads } from "@/lib/admin/leads";
import { mailboxConfigured, syncMailbox } from "@/lib/admin/mailbox";
import { reportError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Background mail check, called on a schedule (see
 * .github/workflows/check-mail.yml). Imports new mail, checks emails from
 * people against the project rules and sends Telegram alerts for good fits —
 * so leads are announced even when nobody has the admin open.
 *
 * Callers must send "Authorization: Bearer <CRON_SECRET>".
 */

const SYNC_BUDGET_MS = 35_000;

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const hash = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(hash(given), hash(`Bearer ${secret}`));
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET isn't set." },
      { status: 503 },
    );
  }
  if (!authorised(request)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }
  if (!adminDbConfigured() || !mailboxConfigured()) {
    return NextResponse.json(
      { error: "The database or mailbox isn't configured." },
      { status: 503 },
    );
  }

  const started = Date.now();
  let imported = 0;
  try {
    // Each call imports a batch; stop early rather than run out of time.
    while (Date.now() - started < SYNC_BUDGET_MS) {
      const result = await syncMailbox("INBOX");
      imported += result.imported;
      if (result.remaining === 0) break;
    }
  } catch (error) {
    await reportError("mailbox-sync", error, { trigger: "scheduled check" });
    return NextResponse.json(
      { error: "Mailbox sync failed." },
      { status: 502 },
    );
  }

  const alerts = await checkNewInboxLeads();
  return NextResponse.json({ imported, alerts, ms: Date.now() - started });
}
