import type { ReactNode } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";

/** Shared layout for the Privacy Policy and Terms of Service. */
export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={intro} />
      <Section divider>
        <article className="legal mx-auto max-w-3xl">
          <p className="text-sm text-white/60">Last updated: {updated}</p>
          {children}
        </article>
      </Section>
    </>
  );
}

export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-12 scroll-mt-28 text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl"
    >
      {children}
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/75">
      {children}
    </p>
  );
}

export function List({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] leading-relaxed text-white/75 marker:text-white/40">
      {children}
    </ul>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
