import type { Service } from "@/lib/content";
import { cn } from "@/lib/utils";
import { GlowCard } from "./GlowCard";
import { TechPills } from "./TechPills";

type ServiceCardProps = {
  service: Service;
  /** The first card is given extra width and a fuller treatment. */
  featured?: boolean;
  className?: string;
};

export function ServiceCard({
  service,
  featured = false,
  className,
}: ServiceCardProps) {
  const Icon = service.icon;

  return (
    <GlowCard
      glow={featured ? "rgba(76,125,255,0.20)" : "rgba(139,92,246,0.16)"}
      radius={featured ? 520 : 360}
      className={cn("h-full", className)}
    >
      <div
        className={cn("flex h-full flex-col p-6 sm:p-7", featured && "lg:p-9")}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/85",
            "transition-[transform,color,border-color] duration-500 ease-out",
            "group-hover/card:-translate-y-0.5 group-hover/card:border-white/20 group-hover/card:text-white",
            "motion-reduce:group-hover/card:translate-y-0",
            featured ? "size-12" : "size-11",
          )}
        >
          <Icon
            aria-hidden="true"
            className={featured ? "size-5.5" : "size-5"}
            strokeWidth={1.5}
          />
        </span>

        <h3
          className={cn(
            "mt-6 font-semibold tracking-[-0.015em] text-white",
            featured ? "text-xl sm:text-2xl" : "text-lg",
          )}
        >
          {service.title}
        </h3>

        <p
          className={cn(
            "mt-3 leading-relaxed text-white/55",
            featured ? "max-w-md text-base" : "text-sm",
          )}
        >
          {service.description}
        </p>

        {featured ? (
          <TechPills items={service.tech} className="mt-7" size="sm" />
        ) : (
          <p className="mt-auto pt-6 font-mono text-[0.625rem] tracking-wide text-white/32">
            {service.tech.join("  ·  ")}
          </p>
        )}
      </div>
    </GlowCard>
  );
}
