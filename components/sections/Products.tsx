import { products, type Product } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductShowcase } from "./ProductShowcase";
import {
  AICareerOSVisual,
  LearnOnlineVisual,
  NexusMeetVisual,
  ProductScreenshot,
} from "./ProductVisuals";

/**
 * A real screenshot wins when the product has one; otherwise each product falls
 * back to its own bespoke mockup rather than a shared template.
 */
function visualFor(product: Product) {
  if (product.screenshot) {
    return (
      <ProductScreenshot
        url={product.display}
        src={product.screenshot.src}
        alt={product.screenshot.alt}
      />
    );
  }

  switch (product.slug) {
    case "nexusmeet":
      return <NexusMeetVisual url={product.display} />;
    case "learnonline":
      return <LearnOnlineVisual />;
    default:
      return <AICareerOSVisual url={product.display} />;
  }
}

export function Products() {
  return (
    <Section id="products" divider aria-labelledby="products-heading">
      <SectionHeading
        id="products-heading"
        eyebrow="Our Products"
        title="Ideas transformed into products."
        description="Shailmann Tech builds products focused on productivity, education, AI, and modern digital experiences — each one designed, engineered and shipped end to end by the same team."
      />

      <div className="mt-16 flex flex-col gap-24 sm:mt-20 lg:mt-24 lg:gap-32 xl:gap-40">
        {products.map((product, index) => (
          <ProductShowcase
            key={product.slug}
            product={product}
            reverse={index % 2 === 1}
            visual={visualFor(product)}
          />
        ))}
      </div>
    </Section>
  );
}
