import { technologies } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { TechGlyph } from "@/components/ui/TechGlyph";
import { TechMarquee } from "@/components/ui/TechMarquee";

export function Technology() {
  return (
    <Section
      id="technology"
      divider
      aria-labelledby="technology-heading"
      backdrop={
        <div className="absolute top-1/2 left-1/2 h-[30rem] w-[52rem] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(76,125,255,0.10),transparent_65%)] blur-3xl" />
      }
    >
      <SectionHeading
        id="technology-heading"
        eyebrow="Our Stack"
        title="Built with technology we trust."
        description="A deliberately focused toolset. Every technology here is one we run in production, maintain over time, and can reason about when something goes wrong."
        align="center"
      />

      <StaggerGroup
        as="ul"
        stagger={0.035}
        className="mt-14 grid grid-cols-2 gap-3 sm:mt-16 sm:grid-cols-3 lg:mt-20 lg:grid-cols-4"
      >
        {technologies.map((tech) => (
          <StaggerItem as="li" key={tech.key}>
            <div className="group/tech flex h-full items-center gap-3.5 rounded-xl border border-white/8 bg-white/[0.02] p-4 transition-[background-color,border-color,transform] duration-400 ease-out hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.045] motion-reduce:hover:translate-y-0 sm:gap-4 sm:p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03] text-white/60 transition-colors duration-400 group-hover/tech:border-white/15 group-hover/tech:text-brand-cyan sm:size-11">
                <TechGlyph name={tech.key} className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white/85">
                  {tech.name}
                </span>
                <span className="block truncate font-mono text-[0.625rem] tracking-wide text-white/35 uppercase">
                  {tech.category}
                </span>
              </span>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <div className="mt-14 space-y-3 sm:mt-16">
        <TechMarquee />
        <TechMarquee reverse />
      </div>
    </Section>
  );
}
