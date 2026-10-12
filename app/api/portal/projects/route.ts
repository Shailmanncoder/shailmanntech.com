import { NextResponse } from "next/server";
import { validateContact } from "@/lib/contact";
import { intake } from "@/lib/intake";
import {
  clientRoute,
  fail,
  limited,
  readBody,
  str,
  tooMany,
} from "@/lib/portal/api";
import { projectsFor } from "@/lib/portal/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = clientRoute(async (client) =>
  NextResponse.json({ projects: await projectsFor(client.email) }),
);

/** A new project from a signed-in client: same pipeline as the contact form. */
export const POST = clientRoute(async (client, request: Request) => {
  if (await limited(`portal-new:${client.id}`, 5, 3600)) return tooMany();
  const body = await readBody(request);
  const payload = {
    name: client.name || client.email,
    email: client.email,
    company: str(body.company, 160).trim(),
    service: str(body.service, 120).trim(),
    message: str(body.description, 5000).trim(),
    budget: str(body.budget, 60).trim(),
  };
  const errors = validateContact(payload);
  if (Object.keys(errors).length) {
    return fail(
      errors.service ?? errors.message ?? "Please check the form.",
      422,
    );
  }

  const result = await intake(payload, str(body.title, 160));
  if (result.status === "duplicate") {
    return fail("You've already sent this project — it's in your list.", 409);
  }
  if (result.status !== "sent") {
    return fail(
      "We couldn't send that just now. Please try again in a minute.",
      502,
    );
  }
  return NextResponse.json({ projectId: result.projectId });
});
