import Image from "next/image";
import type { Product } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { GlowCard } from "@/components/ui/GlowCard";

/**
 * A product's case study: the challenge, how it was built, what came of it,
 * screenshots and a quote. Renders nothing until the product has one.
 */
export function CaseStudy({ product }: { product: Product }) {
  const study = product.caseStudy;
  if (!study) return null;

  return (
    <Section divider aria-labelledby="case-study-heading">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-20">
        <div className="min-w-0">
          <SectionHeading
            id="case-study-heading"
            eyebrow="Case Study"
            title="The challenge."
            description={study.challenge}
          />
          <Reveal delay={0.15}>
            <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                ["Role", study.role],
                ["Year", study.year],
                ["Status", study.status],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="font-mono text-[0.625rem] tracking-[0.2em] text-white/50 uppercase">
                    {label}
                  </dt>
                  <dd className="mt-2 text-sm text-white/80">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <div className="min-w-0">
          <Reveal>
            <h3 className="font-mono text-[0.625rem] tracking-[0.2em] text-white/50 uppercase">
              How we built it
            </h3>
          </Reveal>
          <StaggerGroup
            as="ul"
            stagger={0.07}
            className="mt-6 flex flex-col gap-4"
          >
            {study.approach.map((step, index) => (
              <StaggerItem as="li" key={`${index}-${step.title}`}>
                <div className="flex gap-5 rounded-2xl border border-white/8 bg-white/[0.02] p-5 sm:p-6">
                  <span className="font-mono text-xs tracking-[0.2em] text-white/50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold tracking-[-0.01em] text-white">
                      {step.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">
                      {step.body}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>

      {study.outcomes?.length ? <h3 className="sr-only">Results</h3> : null}
      {study.outcomes?.length ? (
        <StaggerGroup
          as="ul"
          stagger={0.06}
          className="mt-16 grid grid-cols-2 gap-4 sm:mt-20 lg:grid-cols-4"
        >
          {study.outcomes.map((outcome, index) => (
            <StaggerItem as="li" key={`${index}-${outcome.label}`}>
              <GlowCard className="h-full" glow={product.accent.glow}>
                <div className="p-6">
                  <p className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                    {outcome.value}
                  </p>
                  <p className="mt-2 text-sm text-white/60">{outcome.label}</p>
                </div>
              </GlowCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : null}

      {study.gallery?.length ? (
        <div className="mt-16 grid gap-6 sm:mt-20 md:grid-cols-2">
          {study.gallery.map((shot) => (
            <Reveal key={shot.src}>
              <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={1600}
                  height={1000}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="h-auto w-full"
                />
                <figcaption className="border-t border-white/8 px-5 py-3 text-sm text-white/60">
                  {shot.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      ) : null}

      {study.quote ? (
        <Reveal>
          <figure className="mx-auto mt-16 max-w-3xl text-center sm:mt-20">
            <blockquote className="text-xl leading-relaxed font-medium tracking-[-0.015em] text-balance text-white sm:text-2xl">
              &ldquo;{study.quote.text}&rdquo;
            </blockquote>
            <figcaption className="mt-5 text-sm text-white/60">
              <span className="text-white/85">{study.quote.author}</span> ·{" "}
              {study.quote.role}
            </figcaption>
          </figure>
        </Reveal>
      ) : null}
    </Section>
  );
}
