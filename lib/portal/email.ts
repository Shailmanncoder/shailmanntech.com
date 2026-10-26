import "server-only";
import {
  displayAddress,
  inboxAddress,
  senderAddress,
  sendViaResend,
} from "@/lib/contact-delivery";
import { isBlockedSender } from "@/lib/admin/blocked";
import { reportError } from "@/lib/errors";
import { site } from "@/lib/site";
import { CODE_MINUTES, type CodePurpose } from "./auth";
import { STATUS_LABELS, type Project, type ProjectStatus } from "./projects";

/** Emails the portal sends. Failures are logged on the admin's System page. */

async function send(email: Record<string, unknown>, key?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email isn't configured (RESEND_API_KEY).");
  const result = await sendViaResend(
    apiKey,
    {
      from: displayAddress(site.name, senderAddress()),
      reply_to: inboxAddress(),
      ...email,
    },
    key ? { idempotencyKey: key } : {},
  );
  if (result.status !== "sent") throw new Error(result.message);
}

export async function sendCode(to: string, code: string, purpose: CodePurpose) {
  // A blocked sender never gets a code, so can't sign up or reset a password.
  if (await isBlockedSender(to)) return;
  const what =
    purpose === "verify" ? "confirm your email address" : "reset your password";
  await send({
    to: [to],
    subject: `${code} is your ${site.name} code`,
    text: [
      `Your code to ${what}:`,
      "",
      `    ${code}`,
      "",
      `It expires in ${CODE_MINUTES} minutes. If you didn't ask for it, you can ignore this email.`,
      "",
      `— ${site.name}`,
    ].join("\n"),
  });
}

const portalUrl = (projectId: string) =>
  `${site.url}/dashboard/projects/${projectId}`;

/** Tells the client about an update the team posted. */
export async function sendProjectUpdate(
  project: Project,
  update: {
    id: string;
    body: string;
    status: ProjectStatus | null;
    progress: number | null;
  },
) {
  try {
    await send(
      {
        to: [project.email],
        subject: `Update on your project: ${project.title}`,
        text: [
          `Hi ${project.name.split(" ")[0] || "there"},`,
          "",
          update.status ? `Status: ${STATUS_LABELS[update.status]}` : "",
          update.progress !== null ? `Progress: ${update.progress}%` : "",
          update.status || update.progress !== null ? "" : "",
          update.body,
          "",
          `See the full project and reply: ${portalUrl(project.id)}`,
          "Or just reply to this email.",
          "",
          `— ${site.name}`,
        ]
          .filter((line, i, all) => line !== "" || all[i - 1] !== "")
          .join("\n"),
      },
      `project-update-${update.id}`,
    );
    return true;
  } catch (error) {
    await reportError("contact-delivery", error, {
      stage: "project update email",
      project: project.id,
    });
    return false;
  }
}

/** Tells the team a client wrote on a project in the portal. */
export async function notifyTeamOfClientMessage(
  project: Project,
  body: string,
) {
  try {
    await send({
      to: [inboxAddress()],
      reply_to: project.email,
      subject: `Client message on: ${project.title}`,
      text: [
        `${project.name || project.email} wrote on their project in the client portal:`,
        "",
        body,
        "",
        `Open it in the admin: ${site.url}/admin`,
      ].join("\n"),
    });
  } catch (error) {
    await reportError("contact-delivery", error, {
      stage: "client message notification",
    });
  }
}
