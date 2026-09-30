import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearFailures,
  createSessionValue,
  credentialsMatch,
  lockedOut,
  parseSession,
  recordFailure,
  sessionActive,
} from "@/lib/admin/auth";
import { resetMemoryLimits } from "@/lib/rate-limit";

beforeEach(() => {
  process.env.ADMIN_USERNAME = "owner";
  process.env.ADMIN_PASSWORD = "correct horse battery staple";
  delete process.env.ADMIN_SESSION_SECRET;
  delete process.env.DATABASE_URL;
  resetMemoryLimits();
  vi.useRealTimers();
});

describe("credentials", () => {
  it("accepts only the exact username and password", () => {
    expect(credentialsMatch("owner", "correct horse battery staple")).toBe(
      true,
    );
    expect(credentialsMatch("owner", "wrong")).toBe(false);
    expect(credentialsMatch("Owner", "correct horse battery staple")).toBe(
      false,
    );
    expect(credentialsMatch("", "")).toBe(false);
  });

  it("refuses everyone when no credentials are configured", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(credentialsMatch("owner", "")).toBe(false);
  });
});

describe("sessions", () => {
  it("accepts a session it signed", async () => {
    expect(await sessionActive((await createSessionValue()).value)).toBe(true);
  });

  it("rejects a forged or tampered session", async () => {
    const { value } = await createSessionValue();
    const [generation, expires, signature] = value.split(".");
    expect(
      await sessionActive(`${generation}.${Number(expires) + 1}.${signature}`),
    ).toBe(false);
    expect(await sessionActive(`1.${expires}.${signature}`)).toBe(false);
    expect(await sessionActive(`${generation}.${expires}.forged`)).toBe(false);
    expect(await sessionActive("nonsense")).toBe(false);
    expect(await sessionActive(undefined)).toBe(false);
  });

  it("rejects a session in the old two-part format", async () => {
    const { value } = await createSessionValue();
    expect(await sessionActive(value.split(".").slice(1).join("."))).toBe(
      false,
    );
  });

  it("rejects an expired session", async () => {
    const { value } = await createSessionValue();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000);
    expect(parseSession(value)).toBeNull();
  });

  it("invalidates sessions when the password changes", async () => {
    const { value } = await createSessionValue();
    process.env.ADMIN_PASSWORD = "a new password";
    expect(await sessionActive(value)).toBe(false);
  });
});

describe("login lockout without a database", () => {
  it("locks an IP out after five failures and clears on success", async () => {
    const ip = "203.0.113.7";
    for (let i = 0; i < 4; i++) await recordFailure(ip);
    expect(await lockedOut(ip)).toBe(false);
    await recordFailure(ip);
    expect(await lockedOut(ip)).toBe(true);
    expect(await lockedOut("198.51.100.1")).toBe(false);
    await clearFailures(ip);
    expect(await lockedOut(ip)).toBe(false);
  });
});
