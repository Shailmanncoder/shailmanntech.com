"use client";

import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Stat } from "@/lib/content";
import { easeBrand } from "./Reveal";
import { useReducedMotion } from "@/lib/hooks";

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic — settles rather than stopping abruptly
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, target]);

  return value;
}

export function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const target = stat.value ?? 0;
  const count = useCountUp(target, inView && !reduced);
  const resolved = reduced ? target : count;

  const display =
    stat.value !== undefined ? `${resolved}${stat.suffix ?? ""}` : stat.display;

  return (
    <div
      ref={ref}
      className="group/stat relative px-2 py-8 text-center sm:py-10"
      style={
        reduced
          ? undefined
          : {
              transition: `opacity 700ms ${index * 90}ms, transform 700ms ${index * 90}ms`,
              transitionTimingFunction: `cubic-bezier(${easeBrand.join(",")})`,
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(18px)",
            }
      }
    >
      <p className="text-3xl font-semibold tracking-[-0.03em] text-white tabular-nums sm:text-4xl lg:text-5xl">
        <span className="text-gradient">{display}</span>
      </p>
      <p className="mt-3 font-mono text-[0.625rem] tracking-[0.2em] text-white/45 uppercase sm:text-[0.6875rem]">
        {stat.label}
      </p>
    </div>
  );
}
