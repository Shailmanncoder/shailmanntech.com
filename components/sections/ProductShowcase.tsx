import type { ReactNode } from "react";
import type { Product } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { ActionButton } from "@/components/ui/ActionButton";
import { UnderlineLink } from "@/components/ui/UnderlineLink";
import { TechPills } from "@/components/ui/TechPills";
import { TiltCard } from "@/components/ui/TiltCard";

type ProductShowcaseProps = {
  product: Product;
  visual: ReactNode;
  /** Flips the text/visual order on large screens. */
  reverse?: boolean;
};

export function ProductShowcase({
  product,
  visual,
  reverse = false,
}: ProductShowcaseProps) {
  return (
    <article className="group/product grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
      {/* ---------- copy ---------- */}
      <div className={cn("min-w-0", reverse && "lg:order-2")}>
        <Reveal y={20}>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs tracking-[0.2em] text-white/35">
              {product.index}
            </span>
            <span
              aria-hidden="true"
              className="h-px w-10 bg-linear-to-r from-white/25 to-transparent"
            />
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.6875rem] font-medium text-white/55">
              {product.kicker}
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.06} y={20}>
          <h3 className="mt-6 text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            {product.name}
          </h3>
          <p className="mt-2.5 font-mono text-xs text-white/40">
            {product.display}
          </p>
        </Reveal>

        <Reveal delay={0.12} y={20}>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
            {product.description}
          </p>
        </Reveal>

        <Reveal delay={0.18} y={20}>
          <TechPills items={product.tech} className="mt-7" size="sm" />
        </Reveal>

        <Reveal delay={0.24} y={20}>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <ActionButton
              href={product.url}
              variant="secondary"
              arrow="up-right"
            >
              {product.cta}
            </ActionButton>
            <UnderlineLink href={`/products/${product.slug}`}>
              Product details
            </UnderlineLink>
          </div>
        </Reveal>
      </div>

      {/* ---------- visual ---------- */}
      <Reveal
        delay={0.1}
        y={28}
        className={cn("relative min-w-0", reverse && "lg:order-1")}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] opacity-60 blur-3xl transition-opacity duration-700 group-hover/product:opacity-100"
          style={{
            background: `radial-gradient(60% 60% at 50% 40%, ${product.accent.glow}, transparent 70%)`,
          }}
        />
        <TiltCard max={4}>{visual}</TiltCard>
      </Reveal>
    </article>
  );
}
