import { services } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { GlowCard } from "@/components/ui/GlowCard";
import { ActionButton } from "@/components/ui/ActionButton";

export function Services() {
  const [featured, ...rest] = services;

  return (
    <Section id="services" divider aria-labelledby="services-heading">
      <SectionHeading
        id="services-heading"
        eyebrow="What We Do"
        title="From infrastructure to interface."
        description="One team across the whole stack — the systems that run your product and the surface people actually touch."
      />

      <StaggerGroup
        as="ul"
        stagger={0.06}
        className="mt-14 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3"
      >
        <StaggerItem as="li" className="sm:col-span-2">
          <ServiceCard service={featured} featured />
        </StaggerItem>

        {rest.map((service) => (
          <StaggerItem as="li" key={service.title}>
            <ServiceCard service={service} />
          </StaggerItem>
        ))}

        <StaggerItem as="li">
          <GlowCard
            glow="rgba(34,211,238,0.18)"
            radius={360}
            className="h-full bg-white/[0.035]"
          >
            <div className="flex h-full flex-col justify-between gap-8 p-6 sm:p-7">
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.015em] text-white">
                  Something else in mind?
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  Tell us what you are building and we will map the engineering
                  it needs.
                </p>
              </div>
              <ActionButton
                href="/contact"
                variant="secondary"
                arrow="right"
                className="w-full"
              >
                Start a Project
              </ActionButton>
            </div>
          </GlowCard>
        </StaggerItem>
      </StaggerGroup>
    </Section>
  );
}
