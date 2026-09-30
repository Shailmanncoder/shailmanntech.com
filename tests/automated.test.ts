import type { HeaderValue } from "mailparser";
import { afterEach, describe, expect, it } from "vitest";
import { automatedReason, looksPersonal } from "@/lib/admin/automated";

// Parsed headers as mailparser returns them; structured ones (like "list")
// don't fit HeaderValue's declared shape, hence the cast.
const headers = (entries: Record<string, unknown> = {}) =>
  new Map(Object.entries(entries)) as Map<string, HeaderValue>;

afterEach(() => {
  delete process.env.ADMIN_IGNORE_SENDERS;
  delete process.env.ADMIN_ALLOW_SENDERS;
});

describe("automatedReason", () => {
  it.each([
    ["priya@example.com", "Priya Sharma"],
    ["liam@acme-logistics.com", "Liam Chen"],
    ["info@omar-bakery.com", "Omar"],
    ["zeno.rocha@resend.com", "Zeno Rocha"],
    ["zeno@resend.com", "Zeno Rocha"],
    ["sundar_p@google.com", "Sundar P"],
  ])("keeps %s from a person in the inbox", (email, name) => {
    expect(automatedReason(email, headers(), name)).toBeNull();
  });

  it.each([
    ["renewals@godaddy.com", "GoDaddy", {}],
    ["team@resend.com", "Resend", {}],
    ["notifications@vercel.com", "Vercel", {}],
    ["no-reply@shop.example", "Shop", {}],
    ["mailer-daemon@mx.example", "Mail Delivery", {}],
    ["bounce@secureserver.net", "", {}],
    ["editor@weeklynews.io", "Weekly", { list: { unsubscribe: { url: "x" } } }],
    [
      "editor@weeklynews.io",
      "Weekly",
      { "list-unsubscribe": "<mailto:u@x.io>" },
    ],
    ["deals@promo.example", "Deals", { "x-mailer": "Mailchimp Mailer" }],
    ["kenji@example.net", "Kenji Mori", { "auto-submitted": "auto-replied" }],
    ["news@site.example", "Site", { precedence: "bulk" }],
  ])("files %s as automated", (email, name, extra) => {
    expect(automatedReason(email, headers(extra), name)).not.toBeNull();
  });

  it("treats Auto-Submitted: no as a person", () => {
    expect(
      automatedReason(
        "ana@example.net",
        headers({ "auto-submitted": "no" }),
        "Ana",
      ),
    ).toBeNull();
  });

  it("honours the ignore and allow lists", () => {
    process.env.ADMIN_IGNORE_SENDERS = "pushy-client.example, spam@x.example";
    expect(automatedReason("bob@pushy-client.example", headers(), "Bob")).toBe(
      "On your ignore list",
    );
    expect(
      automatedReason("bob@sub.pushy-client.example", headers(), "Bob"),
    ).not.toBeNull();

    process.env.ADMIN_ALLOW_SENDERS = "godaddy.com";
    expect(
      automatedReason("renewals@godaddy.com", headers(), "GoDaddy"),
    ).toBeNull();
  });
});

describe("looksPersonal", () => {
  it("recognises first.last and first-name addresses", () => {
    expect(looksPersonal("jane.doe@x.com", "")).toBe(true);
    expect(looksPersonal("jane@x.com", "Jane Doe")).toBe(true);
  });

  it("rejects role addresses", () => {
    expect(looksPersonal("team@x.com", "The Team")).toBe(false);
    expect(looksPersonal("billing@x.com", "Billing")).toBe(false);
    expect(looksPersonal("jane@x.com", "Jane")).toBe(false);
  });
});

describe("service company role addresses", () => {
  it.each([
    ["team-notifications@github.com", "GitHub"],
    ["customer.care@stripe.com", "Stripe"],
  ])("files %s as automated even though it has a separator", (email, name) => {
    expect(automatedReason(email, new Map(), name)).not.toBeNull();
  });
});
