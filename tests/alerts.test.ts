import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const reportError = vi.fn(async () => {});
vi.mock("@/lib/errors", () => ({ reportError }));

const smartReply = vi.fn();
let aiOn = false;
vi.mock("@/lib/admin/ai", () => ({
  aiConfigured: () => aiOn,
  smartReply: (...args: unknown[]) => smartReply(...args),
}));

const { alertsFor, leadAlert, sendTelegram } = await import("@/lib/telegram");
const { checkFormLead } = await import("@/lib/admin/leads");
const { GET: checkMail } = await import("@/app/api/cron/check-mail/route");

const payload = {
  name: "Ada <script>",
  email: "ada@example.com",
  service: "React Development",
  message: "Dashboard & reports for <b>our</b> team.",
};

let sent: { chat_id: string; text: string }[] = [];

beforeEach(() => {
  sent = [];
  aiOn = false;
  smartReply.mockReset();
  reportError.mockClear();
  delete process.env.DATABASE_URL;
  delete process.env.TELEGRAM_ALERT_ON;
  process.env.TELEGRAM_BOT_TOKEN = "123:abc";
  process.env.TELEGRAM_CHAT_ID = "42";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)));
      return Response.json({ ok: true });
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("alert messages", () => {
  it("escapes the sender's text so it can't inject formatting", () => {
    const text = leadAlert({
      decision: "yes",
      reason: "Fits <React>",
      name: payload.name,
      email: payload.email,
      subject: payload.service,
      preview: payload.message,
      via: "form",
      adminUrl: "https://shailmanntech.com/admin",
    });
    expect(text).toContain("Ada &lt;script&gt;");
    expect(text).toContain("&lt;b&gt;our&lt;/b&gt;");
    expect(text).toContain("Good-fit lead");
    expect(text).not.toContain("<script>");
  });

  it("alerts on good fits by default, or on what TELEGRAM_ALERT_ON lists", () => {
    expect(alertsFor("yes")).toBe(true);
    expect(alertsFor("no")).toBe(false);
    process.env.TELEGRAM_ALERT_ON = "yes, info";
    expect(alertsFor("info")).toBe(true);
    process.env.TELEGRAM_ALERT_ON = "all";
    expect(alertsFor("spam")).toBe(true);
  });

  it("sends to the configured chat and logs a refused message", async () => {
    expect(await sendTelegram("hi")).toBe(true);
    expect(sent[0]).toMatchObject({
      chat_id: "42",
      text: "hi",
      parse_mode: "HTML",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { ok: false, description: "chat not found" },
          { status: 400 },
        ),
      ),
    );
    expect(await sendTelegram("hi")).toBe(false);
    expect(reportError).toHaveBeenCalledWith("alerts", expect.any(Error));
  });
});

describe("form request alerts", () => {
  it("announces every request when there's no AI to judge it", async () => {
    await checkFormLead(payload, null);
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toContain("New project request");
  });

  it("announces good fits only, once AI is judging", async () => {
    aiOn = true;
    smartReply.mockResolvedValueOnce({
      decision: "no",
      reason: "WordPress",
      draft: "…",
    });
    await checkFormLead(payload, null);
    expect(sent).toHaveLength(0);

    smartReply.mockResolvedValueOnce({
      decision: "yes",
      reason: "React dashboard",
      draft: "…",
    });
    await checkFormLead(payload, null);
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toContain("React dashboard");
  });

  it("does nothing when neither AI nor Telegram is set up", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    await checkFormLead(payload, null);
    expect(sent).toHaveLength(0);
  });

  it("never lets an AI failure break anything", async () => {
    aiOn = true;
    smartReply.mockRejectedValueOnce(new Error("OpenAI down"));
    await expect(checkFormLead(payload, null)).resolves.toBeUndefined();
    expect(reportError).toHaveBeenCalledWith(
      "alerts",
      expect.any(Error),
      expect.anything(),
    );
  });
});

describe("scheduled mail check", () => {
  const call = (auth?: string) =>
    checkMail(
      new Request("http://localhost/api/cron/check-mail", {
        headers: auth ? { authorization: auth } : {},
      }),
    );

  it("is switched off without CRON_SECRET", async () => {
    delete process.env.CRON_SECRET;
    expect((await call("Bearer anything")).status).toBe(503);
  });

  it("refuses callers without the secret", async () => {
    process.env.CRON_SECRET = "s3cret";
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    expect((await call("s3cret")).status).toBe(401);
  });

  it("accepts the secret (then reports what isn't configured)", async () => {
    process.env.CRON_SECRET = "s3cret";
    expect((await call("Bearer s3cret")).status).toBe(503);
  });
});
