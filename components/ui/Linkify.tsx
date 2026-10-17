import { Fragment } from "react";

/**
 * Plain text with its web addresses and email addresses turned into links.
 *
 * Only http(s) links and email addresses are linked — never other schemes
 * such as javascript: — so text from outside senders can't smuggle in a
 * harmful link. Web links open in a new tab without access to this page.
 */

// https://…, http://…, www.…, or name@domain.tld
const LINK =
  /\b(?:https?:\/\/|www\.)[^\s<>"']+|\b[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}\b/gi;

// Punctuation that ends a sentence rather than the link: "see example.com."
const TRAILING = /[.,!?;:'")\]]+$/;

export type LinkPart = { text: string; href?: string };

/** Splits text into plain parts and link parts (exported for tests). */
export function linkParts(text: string): LinkPart[] {
  const parts: LinkPart[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    let raw = match[0];
    const start = match.index ?? 0;

    // Keep a closing bracket that belongs to the link, e.g. Wikipedia URLs.
    const trailing = raw.match(TRAILING)?.[0] ?? "";
    if (trailing) {
      const opens = (raw.match(/\(/g) ?? []).length;
      const closes = (raw.match(/\)/g) ?? []).length;
      const keep =
        trailing.startsWith(")") && opens >= closes ? 0 : trailing.length;
      raw = raw.slice(0, raw.length - keep);
    }

    const isEmail = !/^(https?:\/\/|www\.)/i.test(raw);
    const href = isEmail
      ? `mailto:${raw}`
      : /^www\./i.test(raw)
        ? `https://${raw}`
        : raw;

    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: raw, href });
    last = start + raw.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

export function Linkify({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <>
      {linkParts(text).map((part, index) =>
        part.href ? (
          <a
            key={index}
            href={part.href}
            className={
              className ??
              "break-all text-cyan-200 underline decoration-cyan-200/40 underline-offset-2 hover:decoration-cyan-200"
            }
            {...(part.href.startsWith("mailto:")
              ? {}
              : { target: "_blank", rel: "noopener noreferrer nofollow" })}
          >
            {part.text}
          </a>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}
