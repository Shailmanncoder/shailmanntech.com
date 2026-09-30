import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { freshDatabase } from "./helpers/database";

/** The contact form end to end against Postgres (needs TEST_DATABASE_URL). */
const database = process.env.TEST_DATABASE_URL
  ? await freshDatabase("contact")
  : null;

describe.skipIf(!database)("contact submissions", async () => {
  process.env.DATABASE_URL = database?.url;
  process.env.RESEND_API_KEY = "re_test";
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const { db } = await import("@/lib/admin/db");
  const { POST } = await import("@/app/api/contact/route");

  const resend = vi.fn<(url: string, init: RequestInit) => Promise<Response>>();
  vi.stubGlobal("fetch", resend);

  let n = 0;
  const submit = (
    email: string,
    message = "We need a dashboard for our analytics team.",
  ) =>
    POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": `192.0.2.${++n}`,
        },
        body: JSON.stringify({
          name: "Ada",
          email,
          service: "React Development",
          message,
        }),
      }),
    );

  afterAll(async () => {
    vi.unstubAllGlobals();
    const globals = globalThis as unknown as {
      adminSql?: { end(): Promise<void> };
    };
    await globals.adminSql?.end();
    await database?.drop();
  });

  beforeEach(() => {
    resend.mockReset();
    resend.mockImplementation(async () =>
      Response.json({ id: `email_${Math.random()}` }),
    );
  });

  const rows = async (email: string) => {
    const sql = await db();
    return sql<
      {
        status: string;
        delivery_id: string | null;
        confirmation_status: string | null;
        error: string | null;
      }[]
    >`
      select status, delivery_id, confirmation_status, error
      from contact_submissions where email = ${email} order by id`;
  };

  it("saves the submission with its delivery ids", async () => {
    expect((await submit("one@example.com")).status).toBe(200);
    const [row] = await rows("one@example.com");
    expect(row.status).toBe("sent");
    expect(row.delivery_id).toMatch(/^email_/);
    expect(row.confirmation_status).toBe("sent");
  });

  it("acknowledges a repeated submission without emailing again", async () => {
    await submit("two@example.com");
    expect(resend).toHaveBeenCalledTimes(2);
    resend.mockClear();
    expect((await submit("two@example.com")).status).toBe(200);
    expect(resend).not.toHaveBeenCalled();
    expect(await rows("two@example.com")).toHaveLength(1);
  });

  it("treats a different message from the same person as new", async () => {
    await submit("three@example.com");
    await submit(
      "three@example.com",
      "A second, different project we'd like help with.",
    );
    expect(await rows("three@example.com")).toHaveLength(2);
  });

  it("records a failed delivery and lets the visitor try again", async () => {
    resend.mockImplementationOnce(
      async () => new Response("down", { status: 503 }),
    );
    expect((await submit("four@example.com")).status).toBe(502);
    const [failed] = await rows("four@example.com");
    expect(failed.status).toBe("failed");
    expect(failed.error).toMatch(/503/);

    expect((await submit("four@example.com")).status).toBe(200);
    const all = await rows("four@example.com");
    expect(all.map((r) => r.status)).toEqual(["failed", "sent"]);
  });

  it("puts failed deliveries on the System page's error list", async () => {
    const sql = await db();
    const errors =
      await sql`select source from app_errors where source = 'contact-delivery'`;
    expect(errors.length).toBeGreaterThan(0);
  });
});
