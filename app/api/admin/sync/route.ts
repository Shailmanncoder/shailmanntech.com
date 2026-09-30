import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { logEvent } from "@/lib/admin/audit";
import { reportError } from "@/lib/errors";
import { mailboxConfigured, syncMailbox } from "@/lib/admin/mailbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = adminRoute(async () => {
  if (!mailboxConfigured()) {
    return NextResponse.json(
      { error: "The mailbox isn't connected yet (IMAP_USER / IMAP_PASSWORD)." },
      { status: 503 },
    );
  }
  try {
    const result = await syncMailbox();
    if (result.imported > 0) {
      await logEvent("mail_synced", {
        details: { imported: result.imported, automated: result.automated },
      });
    }
    return NextResponse.json(result);
  } catch (error) {
    const imap = error as {
      authenticationFailed?: boolean;
      code?: string;
      responseText?: string;
    };
    // The IMAP library reports every server refusal as "Command failed".
    if (imap.authenticationFailed) {
      await reportError(
        "mailbox-sync",
        "The mail server rejected the sign-in.",
        {
          server: imap.responseText,
        },
      );
      return NextResponse.json(
        {
          error:
            "The mail server rejected the mailbox sign-in. Check IMAP_USER and IMAP_PASSWORD in Vercel (and that IMAP_HOST matches your provider).",
        },
        { status: 502 },
      );
    }
    if (imap.code === "ENOTFOUND" || imap.code === "ETIMEDOUT") {
      await reportError("mailbox-sync", error, { code: imap.code });
      return NextResponse.json(
        { error: "Couldn't reach the mail server. Check IMAP_HOST in Vercel." },
        { status: 502 },
      );
    }
    await reportError("mailbox-sync", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed." },
      { status: 500 },
    );
  }
});
