import { NextResponse } from "next/server";
import {
  validateContact,
  type ContactPayload,
  type ContactResponse,
} from "@/lib/contact";
import { deliverContactRequest } from "@/lib/contact-delivery";
import {
  finishSubmission,
  recordSubmission,
  submissionKey,
} from "@/lib/contact-submissions";
import { site } from "@/lib/site";
import { reportError } from "@/lib/errors";
import { allow } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTACT_PER_IP_PER_HOUR = 5;
const CONTACT_PER_ADDRESS_PER_DAY = 3;

const MAX_LENGTHS: Record<string, number> = {
  name: 120,
  email: 200,
  company: 160,
  service: 120,
  message: 5000,
  budget: 60,
};

function sanitise(value: unknown, field: string): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_LENGTHS[field] ?? 200);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ContactResponse>(
      { ok: false, code: "failed", message: "Malformed request body." },
      { status: 400 },
    );
  }

  const raw = (body ?? {}) as Record<string, unknown>;

  const payload: ContactPayload = {
    name: sanitise(raw.name, "name"),
    email: sanitise(raw.email, "email"),
    company: sanitise(raw.company, "company"),
    service: sanitise(raw.service, "service"),
    message: sanitise(raw.message, "message"),
    budget: sanitise(raw.budget, "budget"),
  };

  // Honeypot: silently accept bot submissions without delivering them.
  if (sanitise(raw.website, "name")) {
    return NextResponse.json<ContactResponse>({ ok: true });
  }

  const errors = validateContact(payload);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json<ContactResponse>(
      { ok: false, code: "invalid", errors },
      { status: 422 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limits apply whether or not Turnstile is configured. The per-address
  // limit stops the form being used to flood someone with confirmation emails.
  const withinLimits =
    (await allow(`contact-ip:${ip}`, CONTACT_PER_IP_PER_HOUR, 3600)) &&
    (await allow(
      `contact-to:${payload.email.toLowerCase()}`,
      CONTACT_PER_ADDRESS_PER_DAY,
      86_400,
    ));
  if (!withinLimits) {
    return NextResponse.json<ContactResponse>(
      {
        ok: false,
        code: "failed",
        message: `That's a lot of requests in a short time. Please try again later, or email ${site.email}.`,
      },
      { status: 429 },
    );
  }

  const token =
    typeof raw.turnstileToken === "string" ? raw.turnstileToken : "";
  if (!(await verifyTurnstile(token, ip === "unknown" ? null : ip))) {
    return NextResponse.json<ContactResponse>(
      {
        ok: false,
        code: "failed",
        message:
          "We couldn't confirm the request came from a person. Please try again.",
      },
      { status: 403 },
    );
  }

  // Saved before sending. A repeat of a submission that already went through
  // (a double click, a refresh, a retry) is acknowledged without resending.
  const key = submissionKey(payload);
  const recorded = await recordSubmission(payload, key).catch(async (error) => {
    await reportError("contact-delivery", error, {
      stage: "saving submission",
    });
    return { duplicate: false as const, id: null };
  });
  if (recorded.duplicate) {
    return NextResponse.json<ContactResponse>({ ok: true });
  }

  const result = await deliverContactRequest(payload, key);
  await finishSubmission(recorded.id, result).catch((error) =>
    reportError("contact-delivery", error, {
      stage: "saving outcome",
      id: recorded.id,
    }),
  );

  if (result.status === "sent") {
    return NextResponse.json<ContactResponse>({ ok: true });
  }

  if (result.status === "not_configured") {
    await reportError(
      "config",
      "A contact request arrived but no email delivery is configured.",
    );
    return NextResponse.json<ContactResponse>(
      {
        ok: false,
        code: "not_configured",
        message: `Direct submission isn't connected yet — email ${site.email} and we'll pick it up straight away.`,
      },
      { status: 503 },
    );
  }

  await reportError("contact-delivery", result.message, {
    service: payload.service,
  });

  return NextResponse.json<ContactResponse>(
    {
      ok: false,
      code: "failed",
      message: `We couldn't send that request. Please email ${site.email}.`,
    },
    { status: 502 },
  );
}
