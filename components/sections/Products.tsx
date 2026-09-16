import { products } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductShowcase } from "./ProductShowcase";
import {
  AICareerOSVisual,
  LearnOnlineVisual,
  NexusMateVisual,
} from "./ProductVisuals";

/** Each product gets its own visual language rather than a shared template. */
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

export function Products() {
  return (
    <Section id="products" divider aria-labelledby="products-heading">
      <SectionHeading
        id="products-heading"
        eyebrow="Our Products"
        title="Ideas transformed into products."
        description="Shellman Tech builds products focused on productivity, education, AI, and modern digital experiences — each one designed, engineered and shipped end to end by the same team."
      />

      <div className="mt-16 flex flex-col gap-24 sm:mt-20 lg:mt-24 lg:gap-32 xl:gap-40">
        {products.map((product, index) => (
          <ProductShowcase
            key={product.slug}
            product={product}
            reverse={index % 2 === 1}
            visual={visualFor(product.slug, product.display)}
          />
        ))}
      </div>
    </Section>
  );
}
