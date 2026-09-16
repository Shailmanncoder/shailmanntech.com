"use client";

import { technologies, type Tech } from "@/lib/content";
import { TechGlyph } from "./TechGlyph";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks";

function Pill({ tech }: { tech: Tech }) {
  return (
    <span className="flex shrink-0 items-center gap-2.5 rounded-full border border-white/8 bg-white/[0.025] px-4 py-2.5 whitespace-nowrap text-white/55 transition-colors duration-300 hover:border-white/18 hover:bg-white/[0.05] hover:text-white">
      <TechGlyph name={tech.key} className="size-4" />
      <span className="text-sm font-medium">{tech.name}</span>
    </span>
  );
}

/**
 * Infinite horizontal technology strip. Pauses on hover, and degrades to a
 * static wrapped list when the visitor prefers reduced motion.
 *
 * Decorative: the same technologies are listed semantically in the grid above,
 * so the marquee is hidden from assistive technology.
 */
export function TechMarquee({
  reverse = false,
  items = technologies,
  className,
}: {
  reverse?: boolean;
  items?: Tech[];
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div
        aria-hidden="true"
        className={cn("flex flex-wrap justify-center gap-3", className)}
      >
        {items.map((tech) => (
          <Pill key={tech.key} tech={tech} />
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn("group mask-edges overflow-hidden", className)}
    >
      <div
        className={cn(
          "flex w-max gap-3 will-change-transform group-hover:[animation-play-state:paused]",
          reverse ? "animate-marquee-reverse" : "animate-marquee",
        )}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-3">
            {items.map((tech) => (
              <Pill key={`${copy}-${tech.key}`} tech={tech} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
