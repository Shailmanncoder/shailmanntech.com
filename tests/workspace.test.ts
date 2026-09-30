import { afterAll, describe, expect, it } from "vitest";
import {
  validateAttachments,
  validateLead,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/admin/workspace-validation";
import { freshDatabase } from "./helpers/database";

it("validates and normalizes client records and follow-ups", () => {
  expect(
    validateLead({
      email: " PERSON@example.com ",
      stage: "proposal",
      tags: ["Work", "Work"],
      followUpAt: "2026-10-01T10:00:00Z",
    }),
  ).toMatchObject({
    email: "person@example.com",
    tags: ["Work"],
    followUpAt: "2026-10-01T10:00:00.000Z",
  });
  expect(() => validateLead({ email: "bad", stage: "new" })).toThrow();
  expect(() => validateLead({ email: "a@b.com", stage: "unknown" })).toThrow();
  expect(() =>
    validateLead({ email: "a@b.com", stage: "new", followUpAt: "bad" }),
  ).toThrow();
});
it("bounds attachments and rejects malformed uploads", () => {
  expect(
    validateAttachments([{ filename: "../test.txt", content: "aGVsbG8=" }])[0],
  ).toEqual({ filename: ".._test.txt", content: "aGVsbG8=" });
  expect(() =>
    validateAttachments([{ filename: "a", content: "%%%=" }]),
  ).toThrow();
  expect(() =>
    validateAttachments(Array(6).fill({ filename: "a", content: "YQ==" })),
  ).toThrow();
  expect(() =>
    validateAttachments([
      {
        filename: "a",
        content: Buffer.alloc(MAX_ATTACHMENT_BYTES + 1).toString("base64"),
      },
    ]),
  ).toThrow();
});
const database = process.env.TEST_DATABASE_URL
  ? await freshDatabase("workspace")
  : null;
describe.skipIf(!database)("client workspace persistence", async () => {
  process.env.DATABASE_URL = database?.url;
  const { db } = await import("@/lib/admin/db");
  const { saveLead, listLeads, listTemplates, conversation } = await import(
    "@/lib/admin/workspace"
  );
  const { listMessages } = await import("@/lib/admin/inbox");
  afterAll(async () => {
    await (
      globalThis as unknown as { adminSql?: { end(): Promise<void> } }
    ).adminSql?.end();
    await database?.drop();
  });
  it("updates the same client and preserves notes and reminder", async () => {
    await saveLead({
      email: "CLIENT@example.com",
      stage: "new",
      notes: "Private note",
      tags: ["Design"],
    });
    await saveLead({
      email: "client@example.com",
      stage: "won",
      notes: "Accepted",
      followUpAt: "2026-10-01T10:00:00Z",
      tags: ["Design"],
    });
    const leads = await listLeads();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      stage: "won",
      notes: "Accepted",
      tags: ["Design"],
    });
    expect(await listTemplates()).toHaveLength(4);
  });
  it("isolates mailbox UIDs and combines client conversation", async () => {
    const sql = await db();
    await sql`insert into admin_messages(uidvalidity,uid,mailbox,direction,contact_email,subject,body,status,received_at) values (1,1,'INBOX','incoming','client@example.com','Question','Hello','new',now()),(1,1,'Sent','outgoing','client@example.com','Response','Thanks','replied',now()),(1,2,'INBOX','incoming','other@example.com','Other','Private','new',now())`;
    expect(await listMessages("all", "", 0, "Sent")).toHaveLength(1);
    expect(await listMessages("awaiting", "", 0, "Sent")).toHaveLength(0);
    const history = await conversation("client@example.com");
    expect(history).toHaveLength(2);
    expect(new Set(history.map((m) => m.direction))).toEqual(
      new Set(["incoming", "outgoing"]),
    );
  });
});
