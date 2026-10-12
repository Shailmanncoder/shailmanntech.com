import "server-only";
import { after } from "next/server";
import { adminDbConfigured } from "@/lib/admin/db";
import { checkFormLead } from "@/lib/admin/leads";
import type { ContactPayload } from "@/lib/contact";
import { deliverContactRequest } from "@/lib/contact-delivery";
import {
  finishSubmission,
  recordSubmission,
  submissionKey,
} from "@/lib/contact-submissions";
import { reportError } from "@/lib/errors";
import { createProject } from "@/lib/portal/projects";

/**
 * Takes in a project request, from the contact form or the client portal:
 * saves it, emails the inbox and the client, creates the client's project,
 * then checks its fit and alerts the owner once the visitor has an answer.
 */

export type IntakeResult =
  | { status: "sent"; projectId: string | null }
  | { status: "duplicate" }
  | { status: "not_configured" }
  | { status: "failed"; message: string };

/** Runs after the response when there's a request; straight away otherwise. */
async function later(task: () => Promise<unknown>) {
  try {
    after(task);
  } catch {
    // Outside a request (tests, scripts) there's no "after".
    await task();
  }
}

export async function intake(
  payload: ContactPayload,
  title?: string,
): Promise<IntakeResult> {
  // Saved before sending. A repeat of a submission that already went through
  // (a double click, a refresh, a retry) is acknowledged without resending.
  const key = submissionKey(payload);
  const recorded = await recordSubmission(payload, key).catch(async (error) => {
    await reportError("contact-delivery", error, {
      stage: "saving submission",
    });
    return { duplicate: false as const, id: null };
  });
  if (recorded.duplicate) return { status: "duplicate" };

  const result = await deliverContactRequest(payload, key);
  await finishSubmission(recorded.id, result).catch((error) =>
    reportError("contact-delivery", error, {
      stage: "saving outcome",
      id: recorded.id,
    }),
  );
  if (result.status !== "sent") return result;

  let projectId: string | null = null;
  if (adminDbConfigured()) {
    try {
      const project = await createProject({
        email: payload.email,
        name: payload.name,
        title: title?.trim() || `Project request — ${payload.service}`,
        service: payload.service,
        description: payload.message,
        budget: payload.budget,
        company: payload.company,
        contactSubmissionId: recorded.id,
      });
      projectId = project.id;
    } catch (error) {
      await reportError("contact-delivery", error, {
        stage: "creating the project",
      });
    }
  }

  await later(() => checkFormLead(payload, recorded.id));
  return { status: "sent", projectId };
}
