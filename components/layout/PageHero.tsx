import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/** Shared opening block for the inner routes. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20 lg:pt-44 lg:pb-24",
        className,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="grid-backdrop absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent_78%)]" />
        <div className="absolute -top-48 left-1/2 h-[30rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(76,125,255,0.22),transparent_62%)] blur-3xl animate-drift" />
        <div className="absolute -top-24 right-[8%] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.16),transparent_62%)] blur-3xl animate-drift-slow" />
      </div>

      <div className="container-page relative">
        <div className="max-w-3xl">
          <Reveal y={14}>
            <p className="flex items-center gap-3 font-mono text-[0.6875rem] font-medium tracking-[0.22em] text-white/55 uppercase">
              <span
                aria-hidden="true"
                className="h-px w-8 bg-linear-to-r from-brand-cyan to-brand-violet"
              />
              {eyebrow}
            </p>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="mt-6 text-[2.25rem] leading-[1.06] font-semibold tracking-[-0.035em] text-white sm:text-5xl md:text-6xl lg:text-[4rem]">
              {title}
            </h1>
          </Reveal>

          {description ? (
            <Reveal delay={0.12}>
              <div className="mt-7 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
                {description}
              </div>
            </Reveal>
          ) : null}

          {children ? <Reveal delay={0.18}>{children}</Reveal> : null}
        </div>
      </div>
    </section>
  );
}
