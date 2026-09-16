import type { Metadata } from "next";
import { products } from "@/lib/content";
import { site } from "@/lib/site";
import {
  breadcrumbSchema,
  jsonLd,
  productListSchema,
} from "@/lib/structured-data";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { StaggerGroup, StaggerItem } from "@/components/ui/Reveal";
import { GlowCard } from "@/components/ui/GlowCard";
import { TechPills } from "@/components/ui/TechPills";
import { UnderlineLink } from "@/components/ui/UnderlineLink";
import { ActionButton } from "@/components/ui/ActionButton";
import { CTASection } from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "Products",
  description:
    "NexusMeet, LearnOnline and AI Career OS — digital products designed, engineered and shipped by Shailmann Tech.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: `Products — ${site.name}`,
    description:
      "NexusMeet, LearnOnline and AI Career OS — products built by Shailmann Tech.",
    url: `${site.url}/products`,
  },
};

export default function ProductsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            productListSchema,
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Products", path: "/products" },
            ]),
          ]),
        }}
      />

      <PageHero
        eyebrow="Our Products"
        title="Ideas transformed into products."
        description="Shailmann Tech builds products focused on productivity, education, AI, and modern digital experiences — each one designed, engineered and shipped end to end."
      />

      <Section divider aria-labelledby="product-index">
        <h2 id="product-index" className="sr-only">
          Product index
        </h2>
        <StaggerGroup
          as="ul"
          stagger={0.08}
          className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          {products.map((product) => (
            <StaggerItem as="li" key={product.slug}>
              <GlowCard className="h-full" glow={product.accent.glow}>
                <div className="flex h-full flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs tracking-[0.2em] text-white/30">
                      {product.index}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.6875rem] text-white/55">
                      {product.kicker}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                    {product.name}
                  </h3>
                  <p className="mt-1.5 font-mono text-xs text-white/40">
                    {product.display}
                  </p>
                  <p className="mt-5 flex-1 text-sm leading-relaxed text-white/55">
                    {product.description}
                  </p>

                  <TechPills
                    items={product.tech.slice(0, 3)}
                    className="mt-6"
                    size="sm"
                  />

                  <div className="mt-8 flex flex-col gap-4">
                    <ActionButton
                      href={product.url}
                      variant="secondary"
                      arrow="up-right"
                      className="w-full"
                    >
                      {product.cta}
                    </ActionButton>
                    <UnderlineLink href={`/products/${product.slug}`}>
                      Product details
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
