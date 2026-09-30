import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const reportError = vi.fn(async () => {});
vi.mock("@/lib/errors", () => ({ reportError }));

const { deliverContactRequest } = await import("@/lib/contact-delivery");

const payload = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  service: "React Development",
  message: "We need a dashboard for our analytics team.",
};

type Call = { url: string; body: Record<string, unknown>; key?: string };
let calls: Call[] = [];

function mockFetch(...responses: (Response | Error)[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const headers = init.headers as Record<string, string>;
      calls.push({
        url,
        body: JSON.parse(String(init.body)),
        key: headers["idempotency-key"],
      });
      const next = responses.shift() ?? Response.json({ id: "email_default" });
      if (next instanceof Error) throw next;
      return next;
    }),
  );
}

beforeEach(() => {
  calls = [];
  reportError.mockClear();
  process.env.RESEND_API_KEY = "re_test";
  process.env.CONTACT_FROM_EMAIL = "Shailmann Tech <hello@shailmanntech.com>";
  delete process.env.CONTACT_WEBHOOK_URL;
});

afterEach(() => vi.unstubAllGlobals());

describe("contact delivery", () => {
  it("sends the request and the confirmation, keyed so repeats are dropped", async () => {
    mockFetch(
      Response.json({ id: "email_inbox" }),
      Response.json({ id: "email_confirm" }),
    );
    const result = await deliverContactRequest(payload, "abc");
    expect(result).toEqual({
      status: "sent",
      id: "email_inbox",
      confirmation: { status: "sent", id: "email_confirm" },
    });
    expect(calls.map((c) => c.key)).toEqual(["contact-abc", "confirm-abc"]);
    expect(calls[0].body.reply_to).toBe("ada@example.com");
    expect(calls[1].body.to).toEqual(["ada@example.com"]);
  });

  it("reports a failure when Resend rejects the request, and sends no confirmation", async () => {
    mockFetch(new Response("invalid from address", { status: 422 }));
    const result = await deliverContactRequest(payload, "abc");
    expect(result.status).toBe("failed");
    expect(result.status === "failed" && result.message).toMatch(/422/);
    expect(calls).toHaveLength(1);
  });

  it("reports a failure when Resend can't be reached", async () => {
    mockFetch(new TypeError("fetch failed"));
    const result = await deliverContactRequest(payload, "abc");
    expect(result).toEqual({ status: "failed", message: "fetch failed" });
  });

  it("still counts the request as delivered when only the confirmation fails", async () => {
    mockFetch(
      Response.json({ id: "email_inbox" }),
      new Response("", { status: 500 }),
    );
    const result = await deliverContactRequest(payload, "abc");
    expect(result.status).toBe("sent");
    expect(result.status === "sent" && result.confirmation?.status).toBe(
      "failed",
    );
    expect(reportError).toHaveBeenCalledWith(
      "contact-confirmation",
      expect.stringMatching(/500/),
    );
  });

  it("says so when no delivery is configured", async () => {
    delete process.env.RESEND_API_KEY;
    expect(await deliverContactRequest(payload, "abc")).toEqual({
      status: "not_configured",
    });
  });

  it("reports a failing webhook", async () => {
    process.env.CONTACT_WEBHOOK_URL = "https://hooks.example/contact";
    mockFetch(new Response("", { status: 500 }));
    const result = await deliverContactRequest(payload, "abc");
    expect(result).toEqual({
      status: "failed",
      message: "Webhook responded with 500.",
    });
  });
});
