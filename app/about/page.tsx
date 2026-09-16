import type { Metadata } from "next";
import { principles, technologies } from "@/lib/content";
import { site } from "@/lib/site";
import {
  breadcrumbSchema,
  jsonLd,
  organizationSchema,
} from "@/lib/structured-data";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SystemsVisual } from "@/components/ui/SystemsVisual";
import { GlowCard } from "@/components/ui/GlowCard";
import { TechMarquee } from "@/components/ui/TechMarquee";
import { Stats } from "@/components/sections/Stats";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "About",
  description:
    "Shailmann Tech is a technology studio building modern digital products and engineering solutions across full-stack development, cloud infrastructure and DevOps.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About — ${site.name}`,
    description:
      "A technology studio building modern digital products and engineering solutions.",
    url: `${site.url}/about`,
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            organizationSchema,
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "About", path: "/about" },
            ]),
          ]),
        }}
      />

      <PageHero
        eyebrow="About Us"
        title={
          <>
            We don&rsquo;t just build websites.
            <span className="block text-gradient">We build systems.</span>
          </>
        }
        description="Shailmann Tech is a technology studio focused on building modern digital products and engineering solutions. From polished user interfaces to production infrastructure, we work across the technology stack to turn ideas into reliable digital experiences."
      />

      <Section divider aria-labelledby="approach-heading">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="min-w-0">
            <SectionHeading
              id="approach-heading"
              eyebrow="Our Approach"
              title="One team, the entire stack."
              description={
                <>
                  <p>
                    Most problems worth solving do not stay inside one layer. A
                    slow page can be a rendering decision, a query plan, or a
                    region choice — and a team that only owns one of those ends
                    up guessing.
                  </p>
                  <p className="mt-5">
                    We work across the interface, the services behind it, and
                    the infrastructure underneath, so the product is designed
                    and operated as a single system rather than a set of
                    handovers.
                  </p>
                </>
              }
            />
          </div>
          <Reveal delay={0.1} y={26} className="min-w-0">
            <SystemsVisual />
          </Reveal>
        </div>
      </Section>

      <Section divider aria-labelledby="principles-heading">
        <SectionHeading
          id="principles-heading"
          eyebrow="How We Think"
          title="Four principles we build against."
          description="Not a manifesto — the short list of things we actually check before calling something finished."
          align="center"
        />

        <StaggerGroup
          as="ul"
          stagger={0.07}
          className="mt-14 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2"
        >
          {principles.map((principle) => (
            <StaggerItem as="li" key={principle.index}>
              <GlowCard className="h-full" glow="rgba(76,125,255,0.18)">
                <div className="flex h-full flex-col p-6 sm:p-8">
                  <span className="font-mono text-xs tracking-[0.2em] text-white/30">
                    {principle.index}
                  </span>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">
                    {principle.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
                    {principle.body}
                  </p>
                </div>
              </GlowCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <Section
        divider
        aria-labelledby="stack-heading"
        className="pb-10 sm:pb-14"
      >
        <SectionHeading
          id="stack-heading"
          eyebrow="Our Stack"
          title="Technology we run in production."
          description={`A focused toolset of ${technologies.length} technologies we maintain over time rather than a list of everything we have ever touched.`}
          align="center"
        />
        <div className="mt-12 space-y-3 sm:mt-14">
          <TechMarquee />
          <TechMarquee reverse />
        </div>
      </Section>

      <Stats />
      <CTASection />
    </>
  );
}
