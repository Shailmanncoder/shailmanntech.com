import type { Metadata } from "next";
import { services } from "@/lib/content";
import { site } from "@/lib/site";
import {
  breadcrumbSchema,
  jsonLd,
  professionalServiceSchema,
} from "@/lib/structured-data";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { ActionButton } from "@/components/ui/ActionButton";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Engineering Services",
  description:
    "Full-stack development, React and Next.js engineering, DevOps, AWS, Docker, Linux, Git and cloud infrastructure services from Shailmann Tech.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: `Engineering Services — ${site.name}`,
    description:
      "Full-stack development, React and Next.js engineering, DevOps, AWS, Docker, Linux, Git and cloud infrastructure services.",
    url: `${site.url}/services`,
  },
};

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            professionalServiceSchema,
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Services", path: "/services" },
            ]),
          ]),
        }}
      />

      <PageHero
        eyebrow="What We Do"
        title="From infrastructure to interface."
        description="Shailmann Tech works across the whole stack — the systems that run your product and the surface people actually touch. Every engagement is built on the same foundations: typed code, automated delivery, and infrastructure you can reason about."
      >
        <div className="mt-9 flex flex-wrap gap-3">
          <ActionButton href="/contact" size="lg" arrow="right">
            Start a Project
          </ActionButton>
          <ActionButton href="/#products" size="lg" variant="secondary">
            See our products
          </ActionButton>
        </div>
      </PageHero>

      <Section divider aria-labelledby="all-services">
        <h2 id="all-services" className="sr-only">
          All services
        </h2>
        <StaggerGroup
          as="ul"
          stagger={0.05}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map((service) => (
            <StaggerItem as="li" key={service.title}>
              <ServiceCard service={service} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <ProcessTimeline />
      <CTASection />
    </>
  );
}
