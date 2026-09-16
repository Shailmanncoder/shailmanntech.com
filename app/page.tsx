import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { Products } from "@/components/sections/Products";
import { Services } from "@/components/sections/Services";
import { Technology } from "@/components/sections/Technology";
import { Philosophy } from "@/components/sections/Philosophy";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { About } from "@/components/sections/About";
import { CTASection } from "@/components/sections/CTASection";
import { jsonLd, productListSchema } from "@/lib/structured-data";

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productListSchema) }}
      />
      <Hero />
      <Stats />
      <Products />
      <Services />
      <Technology />
      <Philosophy />
      <ProcessTimeline />
      <About />
      <CTASection />
    </>
  );
}
