import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/content";
import { site } from "@/lib/site";
import { breadcrumbSchema, jsonLd, productSchema } from "@/lib/structured-data";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { ActionButton } from "@/components/ui/ActionButton";
import { GlowCard } from "@/components/ui/GlowCard";
import { TechPills } from "@/components/ui/TechPills";
import { TiltCard } from "@/components/ui/TiltCard";
import { UnderlineLink } from "@/components/ui/UnderlineLink";
import {
  AICareerOSVisual,
  LearnOnlineVisual,
  NexusMateVisual,
} from "@/components/sections/ProductVisuals";
import { CTASection } from "@/components/sections/CTASection";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};

  const title = `${product.name} — ${product.kicker}`;

  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${title} | ${site.name}`,
      description: product.description,
      url: `${site.url}/products/${product.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description: product.description,
    },
  };
}

function visualFor(slug: string, display: string) {
  switch (slug) {
    case "nexusmate":
      return <NexusMateVisual url={display} />;
    case "learnonline":
      return <LearnOnlineVisual />;
    default:
      return <AICareerOSVisual url={display} />;
  }
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const others = products.filter((item) => item.slug !== product.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            productSchema(product.slug),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Products", path: "/products" },
              { name: product.name, path: `/products/${product.slug}` },
            ]),
          ]),
        }}
      />

      <PageHero
        eyebrow={`Product ${product.index} — ${product.kicker}`}
        title={product.name}
        description={product.description}
      >
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
          <ActionButton href={product.url} size="lg" arrow="up-right" external>
            {product.cta}
          </ActionButton>
          <UnderlineLink href="/#products">All products</UnderlineLink>
        </div>
      </PageHero>

      <Section divider aria-labelledby="overview-heading">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal y={26} className="min-w-0 lg:order-2">
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] blur-3xl"
                style={{
                  background: `radial-gradient(60% 60% at 50% 40%, ${product.accent.glow}, transparent 70%)`,
                }}
              />
              <TiltCard max={4}>
                {visualFor(product.slug, product.display)}
              </TiltCard>
            </div>
          </Reveal>

          <div className="min-w-0 lg:order-1">
            <SectionHeading
              id="overview-heading"
              eyebrow="Overview"
              title="What we built."
              description={product.longDescription}
            />
            <Reveal delay={0.18}>
              <div className="mt-9">
                <p className="font-mono text-[0.625rem] tracking-[0.2em] text-white/40 uppercase">
                  Built with
                </p>
                <TechPills items={product.tech} className="mt-4" size="sm" />
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      <Section divider aria-labelledby="highlights-heading">
        <SectionHeading
          id="highlights-heading"
          eyebrow="Engineering Notes"
          title="Decisions behind the product."
          align="center"
        />
        <StaggerGroup
          as="ul"
          stagger={0.07}
          className="mt-14 grid grid-cols-1 gap-4 sm:mt-16 md:grid-cols-3"
        >
          {product.highlights.map((highlight, index) => (
            <StaggerItem as="li" key={highlight.title}>
              <GlowCard className="h-full" glow={product.accent.glow}>
                <div className="flex h-full flex-col p-6 sm:p-7">
                  <span className="font-mono text-xs tracking-[0.2em] text-white/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.015em] text-white">
                    {highlight.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">
                    {highlight.body}
                  </p>
                </div>
              </GlowCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <Section divider aria-labelledby="more-products-heading">
        <SectionHeading
          id="more-products-heading"
          eyebrow="More From Us"
          title="Other Shellman Tech products."
        />
        <StaggerGroup
          as="ul"
          stagger={0.08}
          className="mt-12 grid grid-cols-1 gap-4 sm:mt-14 md:grid-cols-2"
        >
          {others.map((other) => (
            <StaggerItem as="li" key={other.slug}>
              <GlowCard className="h-full" glow={other.accent.glow}>
                <div className="flex h-full flex-col p-6 sm:p-8">
                  <span className="font-mono text-xs tracking-[0.2em] text-white/30">
                    {other.index}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-white">
                    {other.name}
                  </h3>
                  <p className="mt-1.5 font-mono text-xs text-white/40">
                    {other.display}
                  </p>
                  <p className="mt-5 flex-1 text-sm leading-relaxed text-white/55">
                    {other.description}
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <UnderlineLink href={`/products/${other.slug}`}>
                      Product details
                    </UnderlineLink>
                    <UnderlineLink href={other.url} className="text-white/45">
                      {other.display}
                    </UnderlineLink>
                  </div>
                </div>
              </GlowCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <CTASection />
    </>
  );
}
