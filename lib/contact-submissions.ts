import "server-only";
import { createHash } from "node:crypto";
import { adminDbConfigured, db } from "@/lib/admin/db";
import type { ContactPayload } from "./contact";
import type { DeliveryResult } from "./contact-delivery";

/**
 * Durable record of contact-form submissions. Each one is saved before any
 * email goes out, then updated with the outcome, so nothing depends on the
 * request surviving to the end.
 */

/** Same visitor, same service, same message: the same submission. */
export function submissionKey(payload: ContactPayload) {
  const text = [
    payload.email.trim().toLowerCase(),
    payload.service.trim(),
    payload.message.trim().replace(/\s+/g, " "),
  ].join("\n");
  return createHash("sha256").update(text).digest("hex");
}

/** How long an identical submission counts as a repeat of the first. */
const DUPLICATE_WINDOW_HOURS = 24;
/** How long an unfinished submission blocks an identical one. */
const IN_FLIGHT_SECONDS = 120;

export type Recorded =
  { duplicate: true } | { duplicate: false; id: string | null };

export async function recordSubmission(
  payload: ContactPayload,
  key: string,
): Promise<Recorded> {
  if (!adminDbConfigured()) return { duplicate: false, id: null };
  const sql = await db();

  const [previous] = await sql<{ id: string; status: string; age: number }[]>`
    select id, status, extract(epoch from now() - created_at)::int as age
    from contact_submissions
    where dedupe_key = ${key}
      and created_at > now() - make_interval(hours => ${DUPLICATE_WINDOW_HOURS})
    order by created_at desc limit 1`;
  if (previous?.status === "sent") return { duplicate: true };
  if (previous?.status === "received" && previous.age < IN_FLIGHT_SECONDS) {
    return { duplicate: true };
  }

  const [row] = await sql<{ id: string }[]>`
    insert into contact_submissions (dedupe_key, name, email, service, payload)
    values (${key}, ${payload.name}, ${payload.email}, ${payload.service},
            ${sql.json(JSON.parse(JSON.stringify(payload)))})
    returning id`;
  return { duplicate: false, id: String(row.id) };
}

export async function finishSubmission(
  id: string | null,
  result: DeliveryResult,
) {
  if (!id || !adminDbConfigured()) return;
  const sql = await db();
  const confirmation =
    result.status === "sent" ? result.confirmation : undefined;
  await sql`
    update contact_submissions set
      status = ${result.status},
      delivery_id = ${result.status === "sent" ? (result.id ?? null) : null},
      confirmation_status = ${confirmation?.status ?? null},
      confirmation_id = ${confirmation?.status === "sent" ? (confirmation.id ?? null) : null},
      error = ${
        result.status === "failed"
          ? result.message
          : confirmation?.status === "failed"
            ? confirmation.message
            : null
      },
      updated_at = now()
    where id = ${id}`;
}
