import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ActionButton } from "@/components/ui/ActionButton";
import { SystemsVisual } from "@/components/ui/SystemsVisual";

export function About() {
  return (
    <Section id="about" divider aria-labelledby="about-heading">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20 xl:gap-24">
        <div className="min-w-0">
          <Reveal y={14}>
            <p className="flex items-center gap-3 font-mono text-[0.6875rem] font-medium tracking-[0.22em] text-white/55 uppercase">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-linear-to-r from-brand-cyan to-brand-violet"
              />
              About Us
            </p>
          </Reveal>

          <Reveal delay={0.06}>
            <h2
              id="about-heading"
              className="mt-5 text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]"
            >
              We don&rsquo;t just build websites.
              <span className="block text-gradient">We build systems.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              Shellman Tech is a technology studio focused on building modern
              digital products and engineering solutions. From polished user
              interfaces to production infrastructure, we work across the
              technology stack to turn ideas into reliable digital experiences.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ActionButton href="/about" variant="secondary" arrow="right">
                More about us
              </ActionButton>
              <ActionButton href="/services" variant="ghost" arrow="right">
                Our services
              </ActionButton>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1} y={26} className="min-w-0">
          <SystemsVisual />
        </Reveal>
      </div>
    </Section>
  );
}
