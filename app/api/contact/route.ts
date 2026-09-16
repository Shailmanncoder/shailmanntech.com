import { NextResponse } from "next/server";
import {
  validateContact,
  type ContactPayload,
  type ContactResponse,
} from "@/lib/contact";
import { deliverContactRequest } from "@/lib/contact-delivery";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const result = await deliverContactRequest(payload);

  if (result.status === "sent") {
    return NextResponse.json<ContactResponse>({ ok: true });
  }

  if (result.status === "not_configured") {
    return NextResponse.json<ContactResponse>(
      {
        ok: false,
        code: "not_configured",
        message: `Direct submission isn't connected yet — email ${site.email} and we'll pick it up straight away.`,
      },
      { status: 503 },
    );
  }

  return NextResponse.json<ContactResponse>(
    {
      ok: false,
      code: "failed",
      message: `We couldn't send that request. Please email ${site.email}.`,
    },
    { status: 502 },
  );
}
