import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const deliver = vi.fn(async () => ({ status: "sent" as const }));
vi.mock("@/lib/contact-delivery", () => ({ deliverContactRequest: deliver }));

const { POST } = await import("@/app/api/contact/route");
const { resetMemoryLimits } = await import("@/lib/rate-limit");

let ipCounter = 0;

function submit(overrides: Record<string, unknown> = {}, ip = "192.0.2.1") {
  return POST(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({
        name: "Ada Lovelace",
        email: "ada@example.com",
        service: "React Development",
        message: "We need a dashboard for our analytics team, please.",
        ...overrides,
      }),
    }),
  );
}

beforeEach(() => {
  delete process.env.DATABASE_URL;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  resetMemoryLimits();
  deliver.mockClear();
});

afterEach(() => vi.unstubAllGlobals());

describe("contact form rate limits", () => {
  it("allows five submissions an hour from one IP, then refuses", async () => {
    for (let i = 0; i < 5; i++) {
      const response = await submit({ email: `ada${i}@example.com` });
      expect(response.status).toBe(200);
    }
    const blocked = await submit({ email: "ada99@example.com" });
    expect(blocked.status).toBe(429);
    expect(deliver).toHaveBeenCalledTimes(5);
  });

  it("allows three submissions a day to one address, even from many IPs", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await submit({}, `198.51.100.${++ipCounter}`)).status).toBe(200);
    }
    const blocked = await submit({}, `198.51.100.${++ipCounter}`);
    expect(blocked.status).toBe(429);
    expect(deliver).toHaveBeenCalledTimes(3);
  });

  it("doesn't count invalid submissions against the limit", async () => {
    for (let i = 0; i < 6; i++) {
      expect((await submit({ message: "too short" })).status).toBe(422);
    }
    expect((await submit()).status).toBe(200);
  });
});

describe("contact form bot check", () => {
  it("refuses everything when the widget is on but the secret is missing", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key";
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await submit({ turnstileToken: "anything" });
    expect(response.status).toBe(403);
    expect(deliver).not.toHaveBeenCalled();
  });

  it("verifies the token with Cloudflare when configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const fetchMock = vi.fn(async () => Response.json({ success: false }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect((await submit({ turnstileToken: "forged" })).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(deliver).not.toHaveBeenCalled();

    fetchMock.mockImplementation(async () => Response.json({ success: true }));
    expect((await submit({ turnstileToken: "real" })).status).toBe(200);
  });

  it("silently drops honeypot submissions", async () => {
    const response = await submit({ website: "http://spam.example" });
    expect(response.status).toBe(200);
    expect(deliver).not.toHaveBeenCalled();
  });
});
