"use client";

import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";
import { heroTech } from "@/lib/content";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { ActionButton } from "@/components/ui/ActionButton";
import { easeBrand } from "@/components/ui/Reveal";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

const headline = [
  { text: "We build" },
  { text: "technology", gradient: true, breakAfter: true },
  { text: "that moves ideas forward." },
];

export function Hero() {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const parallax = fine && !reduced;

  // Normalised pointer offset, -1 → 1 on each axis.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 26, mass: 0.7 });
  const sy = useSpring(py, { stiffness: 60, damping: 26, mass: 0.7 });

  const orbAX = useTransform(sx, [-1, 1], [-38, 38]);
  const orbAY = useTransform(sy, [-1, 1], [-26, 26]);
  const orbBX = useTransform(sx, [-1, 1], [26, -26]);
  const orbBY = useTransform(sy, [-1, 1], [18, -18]);

  const { scrollYProgress } = useScroll();
  const contentY = useTransform(scrollYProgress, [0, 0.16], [0, -44]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.14], [1, 0]);

  useEffect(() => {
    if (!parallax) return;
    const onMove = (event: MouseEvent) => {
      px.set((event.clientX / window.innerWidth) * 2 - 1);
      py.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [parallax, px, py]);

  return (
    <section
      id="top"
      aria-labelledby="hero-heading"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-32 pb-20 sm:pt-36 lg:pt-40 lg:pb-28"
    >
      {/* ---------- backdrop ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* fine grid, faded toward the edges */}
        <div className="grid-backdrop absolute inset-0 [mask-image:radial-gradient(ellipse_75%_58%_at_50%_38%,black,transparent_78%)] opacity-70" />

        {/* drifting gradient orbs */}
        <motion.div
          style={parallax ? { x: orbAX, y: orbAY } : undefined}
          className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(76,125,255,0.28),transparent_65%)] blur-3xl animate-drift sm:h-[46rem] sm:w-[46rem]"
        />
        <motion.div
          style={parallax ? { x: orbBX, y: orbBY } : undefined}
          className="absolute top-1/4 -left-24 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.22),transparent_65%)] blur-3xl animate-drift-slow sm:h-[32rem] sm:w-[32rem]"
        />
        <motion.div
          style={parallax ? { x: orbBX, y: orbAY } : undefined}
          className="absolute -right-24 bottom-0 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16),transparent_65%)] blur-3xl animate-drift sm:h-[30rem] sm:w-[30rem]"
        />

        {/* vertical light beams */}
        <div className="absolute inset-0 overflow-hidden opacity-60 motion-reduce:hidden">
          <span className="absolute top-0 left-[18%] h-40 w-px bg-linear-to-b from-transparent via-brand-cyan/45 to-transparent animate-beam [animation-delay:-1s]" />
          <span className="absolute top-0 left-[62%] h-56 w-px bg-linear-to-b from-transparent via-brand-violet/40 to-transparent animate-beam [animation-delay:-3.4s]" />
          <span className="absolute top-0 left-[84%] hidden h-32 w-px bg-linear-to-b from-transparent via-brand-blue/40 to-transparent animate-beam [animation-delay:-5.2s] sm:block" />
        </div>

        {/* settle the section into the page background */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-canvas" />
      </div>

      {/* ---------- content ---------- */}
      <motion.div
        style={reduced ? undefined : { y: contentY, opacity: contentOpacity }}
        className="container-page relative z-10"
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeBrand }}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.625rem] font-medium tracking-[0.02em] text-white/70 backdrop-blur-sm sm:px-4 sm:py-2 sm:text-xs"
          >
            <span className="relative flex size-1.5 shrink-0">
              <span className="absolute inline-flex size-full rounded-full bg-brand-cyan animate-pulse-ring motion-reduce:hidden" />
              <span className="relative inline-flex size-1.5 rounded-full bg-brand-cyan" />
            </span>
            Engineering the next generation of digital products
          </motion.p>

          <h1
            id="hero-heading"
            className="mt-7 text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.035em] text-white sm:mt-9 sm:text-[3rem] md:text-[3.5rem] lg:text-[4.5rem] xl:text-[5rem]"
          >
            <AnimatedText segments={headline} delay={0.12} stagger={0.055} />
          </h1>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: easeBrand }}
            className="mt-7 max-w-2xl text-base leading-relaxed text-white/60 sm:mt-8 sm:text-lg"
          >
            Shailmann Tech builds powerful digital products and provides modern
            engineering solutions across full-stack development, cloud
            infrastructure, DevOps, and emerging technologies.
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.68, ease: easeBrand }}
            className="mt-9 flex w-full flex-col items-stretch gap-3 sm:mt-11 sm:w-auto sm:flex-row sm:items-center"
          >
            <ActionButton href="/#products" size="lg" arrow="right">
              Explore Our Work
            </ActionButton>
            <ActionButton href="/contact" size="lg" variant="secondary">
              Start a Project
            </ActionButton>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.85, ease: easeBrand }}
            className="mt-14 w-full sm:mt-16"
          >
            <p className="font-mono text-[0.625rem] tracking-[0.24em] text-white/35 uppercase">
              Built with
            </p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-x-4">
              {heroTech.map((tech, index) => (
                <li key={tech} className="flex items-center gap-3 sm:gap-4">
                  <span className="text-xs font-medium text-white/55 transition-colors duration-300 hover:text-white/85 sm:text-sm">
                    {tech}
                  </span>
                  {/* separators only from sm up, where the strip fits one line */}
                  {index < heroTech.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="hidden size-1 rounded-full bg-white/20 sm:block"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
