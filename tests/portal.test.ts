import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { freshDatabase } from "./helpers/database";

/**
 * The client portal end to end against Postgres (needs TEST_DATABASE_URL):
 * sign-up with an emailed code, login, password reset, Google linking,
 * project ownership and team updates.
 */
const database = process.env.TEST_DATABASE_URL
  ? await freshDatabase("portal")
  : null;

// A cookie jar standing in for the browser.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name)! } : undefined,
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
  headers: async () => new Headers({ "x-forwarded-for": "198.51.100.20" }),
}));

describe.skipIf(!database)("client portal", async () => {
  Object.assign(process.env, {
    DATABASE_URL: database?.url,
    RESEND_API_KEY: "re_test",
    CONTACT_FROM_EMAIL: "Shailmann Tech <hello@shailmanntech.com>",
    ADMIN_USERNAME: "owner",
    ADMIN_PASSWORD: "admin password long",
  });
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const { db } = await import("@/lib/admin/db");
  const { resetMemoryLimits } = await import("@/lib/rate-limit");
  const { currentClient, hashPassword, verifyPassword, CLIENT_COOKIE } =
    await import("@/lib/portal/auth");
  const { createProject } = await import("@/lib/portal/projects");
  const signup = (await import("@/app/api/auth/signup/route")).POST;
  const verify = (await import("@/app/api/auth/verify/route")).POST;
  const login = (await import("@/app/api/auth/login/route")).POST;
  const forgot = (await import("@/app/api/auth/forgot/route")).POST;
  const reset = (await import("@/app/api/auth/reset/route")).POST;
  const listProjects = (await import("@/app/api/portal/projects/route")).GET;
  const projectRoute = (await import("@/app/api/portal/projects/[id]/route"))
    .GET;
  const postMessage = (
    await import("@/app/api/portal/projects/[id]/messages/route")
  ).POST;
  const { createSessionValue, SESSION_COOKIE } =
    await import("@/lib/admin/auth");
  const postUpdate = (
    await import("@/app/api/admin/projects/[id]/updates/route")
  ).POST;
  const clientBell = await import("@/app/api/portal/notifications/route");
  const adminBell = await import("@/app/api/admin/notifications/route");

  // Emails go to a fake Resend; codes are read back out of them.
  const sent: { to: string[]; subject: string; text: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)));
      return Response.json({ id: `email_${sent.length}` });
    }),
  );
  const lastCode = (to: string) =>
    [...sent]
      .reverse()
      .find((m) => m.to.includes(to))
      ?.text.match(/\b(\d{6})\b/)?.[1] ?? "";

  const call = <C>(
    handler: (r: Request, c: C) => Promise<Response>,
    body?: unknown,
    context?: C,
  ) =>
    handler(
      new Request("http://localhost/api", {
        method: body === undefined ? "GET" : "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "198.51.100.20",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      context as C,
    );
  const params = (id: string) => ({ params: Promise.resolve({ id }) });

  beforeEach(() => {
    jar.clear();
    resetMemoryLimits();
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    const globals = globalThis as unknown as {
      adminSql?: { end(): Promise<void> };
    };
    await globals.adminSql?.end();
    await database?.drop();
  });

  it("hashes passwords so only the right one verifies", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toContain("correct");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("wrong horse battery", hash)).toBe(false);
    expect(await verifyPassword("anything", null)).toBe(false);
  });

  it("signs up only after the emailed code is entered", async () => {
    const res = await call(signup, {
      name: "Ada Lovelace",
      email: "Ada@Example.com",
      password: "analytical-engine",
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      next: "verify",
      email: "ada@example.com",
    });
    expect(jar.size).toBe(0); // not signed in yet

    expect(
      (await call(verify, { email: "ada@example.com", code: "000000" })).status,
    ).toBe(400);
    expect(
      (
        await call(verify, {
          email: "ada@example.com",
          code: lastCode("ada@example.com"),
        })
      ).status,
    ).toBe(200);
    expect((await currentClient())?.email).toBe("ada@example.com");
  });

  it("refuses a used code, and locks a code after five wrong tries", async () => {
    const used = lastCode("ada@example.com");
    expect(
      (await call(verify, { email: "ada@example.com", code: used })).status,
    ).toBe(400);

    await call(signup, {
      name: "Bob",
      email: "bob@example.com",
      password: "a strong password",
    });
    const real = lastCode("bob@example.com");
    for (let i = 0; i < 5; i++)
      await call(verify, { email: "bob@example.com", code: "111111" });
    const res = await call(verify, { email: "bob@example.com", code: real });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/new one/);
  });

  it("logs in with the password; an unverified account gets a new code instead", async () => {
    expect(
      (
        await call(login, {
          email: "ada@example.com",
          password: "wrong password",
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await call(login, {
          email: "ada@example.com",
          password: "analytical-engine",
        })
      ).status,
    ).toBe(200);
    expect(jar.has(CLIENT_COOKIE)).toBe(true);

    jar.clear();
    const res = await call(login, {
      email: "bob@example.com",
      password: "a strong password",
    });
    expect(await res.json()).toMatchObject({ next: "verify" });
    expect(jar.has(CLIENT_COOKIE)).toBe(false);
  });

  it("won't create a second account for a verified email", async () => {
    const res = await call(signup, {
      name: "Mallory",
      email: "ada@example.com",
      password: "takeover attempt",
    });
    expect(res.status).toBe(409);
    expect(
      (
        await call(login, {
          email: "ada@example.com",
          password: "takeover attempt",
        })
      ).status,
    ).toBe(401);
  });

  it("resets a password with a code and signs out other devices", async () => {
    await call(login, {
      email: "ada@example.com",
      password: "analytical-engine",
    });
    const oldSession = jar.get(CLIENT_COOKIE)!;
    jar.clear();

    // The answer is the same whether or not the account exists.
    const unknown = await call(forgot, { email: "nobody@example.com" });
    const known = await call(forgot, { email: "ada@example.com" });
    expect(unknown.status).toBe(known.status);
    expect((await unknown.json()).next).toBe((await known.json()).next);
    expect(sent.some((m) => m.to.includes("nobody@example.com"))).toBe(false);

    const res = await call(reset, {
      email: "ada@example.com",
      code: lastCode("ada@example.com"),
      password: "a brand new password",
    });
    expect(res.status).toBe(200);
    jar.set(CLIENT_COOKIE, oldSession);
    expect(await currentClient()).toBeNull();
    expect(
      (
        await call(login, {
          email: "ada@example.com",
          password: "a brand new password",
        })
      ).status,
    ).toBe(200);
  });

  it("shows clients only their own projects, including ones sent before signing up", async () => {
    const mine = await createProject({
      email: "ada@example.com",
      name: "Ada",
      title: "Dashboard",
      service: "React Development",
      description: "A dashboard for the team.",
    });
    const theirs = await createProject({
      email: "eve@example.com",
      name: "Eve",
      title: "Secret",
      service: "DevOps",
      description: "Not Ada's business.",
    });
    await call(login, {
      email: "ada@example.com",
      password: "a brand new password",
    });

    const list = await (await call(listProjects)).json();
    expect(list.projects.map((p: { id: string }) => p.id)).toEqual([mine.id]);
    expect((await call(projectRoute, undefined, params(mine.id))).status).toBe(
      200,
    );
    expect(
      (await call(projectRoute, undefined, params(theirs.id))).status,
    ).toBe(404);
    expect(
      (await call(postMessage, { body: "Can I see it?" }, params(theirs.id)))
        .status,
    ).toBe(404);

    jar.clear();
    expect((await call(listProjects)).status).toBe(401);
  });

  it("delivers a team update to the client's page and inbox", async () => {
    const [project] = await (await db())<
      { id: string }[]
    >`select id from projects where email = 'ada@example.com'`;
    jar.set(SESSION_COOKIE, (await createSessionValue()).value);
    sent.length = 0;
    const res = await call(
      postUpdate,
      { body: "Designs are ready.", status: "in_progress", progress: 40 },
      params(String(project.id)),
    );
    expect(res.status).toBe(200);
    expect(sent[0].to).toEqual(["ada@example.com"]);
    expect(sent[0].text).toContain("Designs are ready.");
    expect(sent[0].text).toContain("In progress");

    jar.clear();
    await call(login, {
      email: "ada@example.com",
      password: "a brand new password",
    });
    const view = await (
      await call(projectRoute, undefined, params(String(project.id)))
    ).json();
    expect(view.project).toMatchObject({ status: "in_progress", progress: 40 });
    expect(view.updates.at(-1)).toMatchObject({
      author: "team",
      body: "Designs are ready.",
    });

    // The same update waits under the client's bell until they read it.
    const bell = await (await clientBell.GET()).json();
    expect(bell.unread).toBeGreaterThanOrEqual(1);
    const update = bell.notifications.find(
      (n: { kind: string }) => n.kind === "project_update",
    );
    expect(update).toMatchObject({ read: false, link: `/dashboard/projects/${project.id}` });
    expect(update.body).toContain("In progress");
    const after = await (
      await call(clientBell.POST, { id: "all" })
    ).json();
    expect(after.unread).toBe(0);
  });

  it("tells the team about sign-ups and client messages, by email and bell", async () => {
    const [project] = await (await db())<
      { id: string }[]
    >`select id from projects where email = 'ada@example.com'`;
    await call(login, {
      email: "ada@example.com",
      password: "a brand new password",
    });
    sent.length = 0;
    await call(postMessage, { body: "Can we add dark mode?" }, params(String(project.id)));
    expect(sent.some((m) => m.subject.startsWith("Client message on"))).toBe(true);

    jar.clear();
    jar.set(SESSION_COOKIE, (await createSessionValue()).value);
    const bell = await (await adminBell.GET()).json();
    const kinds = bell.notifications.map((n: { kind: string }) => n.kind);
    expect(kinds).toContain("client_signup");
    expect(kinds).toContain("client_message");
    expect(
      bell.notifications.find((n: { kind: string }) => n.kind === "client_message").link,
    ).toBe(`/admin?view=projects&id=${project.id}`);

    // A client never sees the team's notifications, and the reverse.
    jar.clear();
    await call(login, { email: "ada@example.com", password: "a brand new password" });
    const theirs = await (await clientBell.GET()).json();
    expect(
      theirs.notifications.every((n: { kind: string }) =>
        ["project_update", "reply", "new_project"].includes(n.kind),
      ),
    ).toBe(true);
  });

  it("removes a stranger's password when Google confirms the real owner", async () => {
    // Mallory signs up with Carol's address but can't verify it.
    await call(signup, {
      name: "Mallory",
      email: "carol@example.com",
      password: "mallory's password",
    });
    const sql = await db();
    // What the Google callback does when Carol signs in with Google:
    await sql`
      insert into clients (email, name, google_sub, email_verified_at)
      values ('carol@example.com', 'Carol', 'google-123', now())
      on conflict (email) do update set google_sub = excluded.google_sub,
        password_hash = case when clients.email_verified_at is null then null else clients.password_hash end,
        email_verified_at = coalesce(clients.email_verified_at, now())`;
    expect(
      (
        await call(login, {
          email: "carol@example.com",
          password: "mallory's password",
        })
      ).status,
    ).toBe(401);
  });
});
