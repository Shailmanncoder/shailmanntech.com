"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { processSteps } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { useReducedMotion } from "@/lib/hooks";

export function ProcessTimeline() {
  const trackRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 78%", "end 55%"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.5,
  });
  const scaleY = useTransform(progress, (value) => Math.max(0.02, value));

  return (
    <Section id="process" divider aria-labelledby="process-heading">
      <SectionHeading
        id="process-heading"
        eyebrow="How We Work"
        title="From concept to production."
        description="A predictable path from the first conversation to a system running in production — and the work that keeps it healthy afterwards."
      />

      <ol
        ref={trackRef}
        className="relative mt-16 flex flex-col gap-10 sm:mt-20 lg:mt-24 lg:flex-row lg:gap-5 xl:gap-7"
      >
        {/* --- track: vertical below lg, horizontal from lg --- */}
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-[7px] w-px bg-white/10 lg:hidden"
        />
        <motion.span
          aria-hidden="true"
          style={reduced ? { scaleY: 1 } : { scaleY }}
          className="absolute top-2 bottom-2 left-[7px] w-px origin-top bg-linear-to-b from-brand-cyan via-brand-blue to-brand-violet lg:hidden"
        />
        <span
          aria-hidden="true"
          className="absolute top-[7px] right-0 left-0 hidden h-px bg-white/10 lg:block"
        />
        <motion.span
          aria-hidden="true"
          style={reduced ? { scaleX: 1 } : { scaleX: scaleY }}
          className="absolute top-[7px] right-0 left-0 hidden h-px origin-left bg-linear-to-r from-brand-cyan via-brand-blue to-brand-violet lg:block"
        />

        {processSteps.map((step, index) => (
          <Reveal
            as="li"
            key={step.index}
            delay={index * 0.06}
            y={22}
            className="group/step relative flex-1 pl-10 lg:pt-12 lg:pl-0"
          >
            <span
              aria-hidden="true"
              className="absolute top-1.5 left-0 flex size-3.5 items-center justify-center rounded-full border border-white/20 bg-canvas transition-colors duration-500 group-hover/step:border-brand-cyan lg:top-0"
            >
              <span className="size-1.5 rounded-full bg-linear-to-br from-brand-cyan to-brand-violet transition-transform duration-500 group-hover/step:scale-125 motion-reduce:group-hover/step:scale-100" />
            </span>

            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 transition-[background-color,border-color,transform] duration-500 ease-out group-hover/step:-translate-y-1 group-hover/step:border-white/18 group-hover/step:bg-white/[0.04] motion-reduce:group-hover/step:translate-y-0 sm:p-6 lg:h-full">
              <span className="font-mono text-xs tracking-[0.18em] text-white/30">
                {step.index}
              </span>
              <h3 className="mt-3 text-base font-semibold tracking-[0.12em] text-white uppercase sm:text-lg sm:tracking-[0.1em]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {step.description}
              </p>

              {/* detail expands on hover / focus, and is always open on touch */}
              <div className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out lg:grid-rows-[0fr] lg:group-hover/step:grid-rows-[1fr] lg:group-focus-within/step:grid-rows-[1fr] motion-reduce:transition-none">
                <div className="overflow-hidden">
                  <p className="mt-4 border-t border-white/8 pt-4 text-[0.8125rem] leading-relaxed text-white/45">
                    {step.detail}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
