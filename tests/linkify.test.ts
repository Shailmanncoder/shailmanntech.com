import { describe, expect, it } from "vitest";
import { linkParts } from "@/components/ui/Linkify";

const links = (text: string) =>
  linkParts(text)
    .filter((p) => p.href)
    .map((p) => [p.text, p.href]);

describe("link detection", () => {
  it("links web addresses, with or without https", () => {
    expect(links("See https://example.com/brief and www.acme.io/docs")).toEqual(
      [
        ["https://example.com/brief", "https://example.com/brief"],
        ["www.acme.io/docs", "https://www.acme.io/docs"],
      ],
    );
  });

  it("links email addresses with mailto", () => {
    expect(links("Write to ana.costa@example.net today")).toEqual([
      ["ana.costa@example.net", "mailto:ana.costa@example.net"],
    ]);
  });

  it("leaves sentence punctuation outside the link", () => {
    expect(links("Brief: https://example.com/a.")).toEqual([
      ["https://example.com/a", "https://example.com/a"],
    ]);
    expect(links("(see https://example.com/x)")).toEqual([
      ["https://example.com/x", "https://example.com/x"],
    ]);
  });

  it("keeps a closing bracket that belongs to the link", () => {
    expect(links("https://en.wikipedia.org/wiki/React_(software)")).toEqual([
      [
        "https://en.wikipedia.org/wiki/React_(software)",
        "https://en.wikipedia.org/wiki/React_(software)",
      ],
    ]);
  });

  it("never links dangerous schemes", () => {
    expect(
      links("javascript:alert(1) data:text/html,hi file:///etc/passwd"),
    ).toEqual([]);
  });

  it("keeps all the original text, in order", () => {
    const text =
      "Hi — files at https://drive.example.com/f?id=1&x=2, or mail me@x.io. Thanks!";
    expect(
      linkParts(text)
        .map((p) => p.text)
        .join(""),
    ).toBe(text);
  });

  it("leaves text without links alone", () => {
    expect(linkParts("No links here.")).toEqual([{ text: "No links here." }]);
  });
});
