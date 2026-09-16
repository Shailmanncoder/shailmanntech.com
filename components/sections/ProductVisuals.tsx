"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { easeBrand } from "@/components/ui/Reveal";
import { useReducedMotion } from "@/lib/hooks";

const viewport = { once: true, amount: 0.35 } as const;

/* ------------------------------------------------------------------ */
/*  Shared chrome                                                      */
/* ------------------------------------------------------------------ */

function BrowserFrame({
  url,
  children,
  className,
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-canvas-raised/95 shadow-[0_40px_90px_-50px_rgba(0,0,0,1)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/8 bg-white/[0.03] px-3 py-2.5 sm:px-4">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/14" />
          <span className="size-2 rounded-full bg-white/10" />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <span className="max-w-full truncate rounded-md bg-white/[0.05] px-2.5 py-1 font-mono text-[0.5625rem] text-white/45 sm:text-[0.625rem]">
            {url}
          </span>
        </div>
        <div className="hidden gap-1.5 sm:flex">
          <span className="h-2 w-4 rounded-sm bg-white/10" />
        </div>
      </div>
      {children}
    </div>
  );
}

/** A soft sheen that sweeps across the mockup while the card is hovered. */
function Sheen() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/8 to-transparent transition-transform duration-[1400ms] ease-out group-hover/product:translate-x-full motion-reduce:hidden"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  01 — NexusMate : application shell                                 */
/* ------------------------------------------------------------------ */

export function NexusMateVisual({ url }: { url: string }) {
  const reduced = useReducedMotion();
  const bars = [72, 48, 88, 56];

  return (
    <BrowserFrame url={url} className="relative">
      <Sheen />
      <div className="flex aspect-16/11 gap-3 p-3 sm:gap-4 sm:p-4">
        {/* sidebar */}
        <div className="hidden w-24 shrink-0 flex-col gap-2 rounded-lg bg-white/[0.03] p-2.5 sm:flex lg:w-28">
          <div className="mb-1 h-4 w-4 rounded bg-linear-to-br from-brand-cyan to-brand-violet" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-5 rounded-md px-1.5",
                i === 1 ? "bg-white/[0.09]" : "bg-white/[0.035]",
              )}
            >
              <div
                className={cn(
                  "mt-2 h-1 rounded-full",
                  i === 1 ? "bg-brand-cyan/70" : "bg-white/15",
                )}
                style={{ width: `${58 + ((i * 13) % 34)}%` }}
              />
            </div>
          ))}
        </div>

        {/* main */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="h-2.5 w-24 rounded-full bg-white/20 sm:w-32" />
            <div className="h-6 w-16 rounded-md bg-linear-to-r from-[#3a5cf0] to-[#7c3aed] opacity-80 sm:w-20" />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {bars.map((height, i) => (
              <div
                key={i}
                className="flex h-16 flex-col justify-between rounded-lg border border-white/8 bg-white/[0.025] p-2 sm:h-20 sm:p-2.5"
              >
                <div className="h-1.5 w-8 rounded-full bg-white/15" />
                <div className="flex items-end gap-0.5">
                  {[0, 1, 2, 3, 4, 5].map((b) => (
                    <motion.span
                      key={b}
                      className="w-1 rounded-sm bg-linear-to-t from-brand-blue/30 to-brand-cyan/80"
                      initial={reduced ? false : { height: 2 }}
                      whileInView={{
                        height: `${Math.max(18, (height + b * 9) % 100)}%`,
                      }}
                      viewport={viewport}
                      transition={{
                        duration: 0.7,
                        delay: 0.1 + b * 0.05 + i * 0.08,
                        ease: easeBrand,
                      }}
                      style={{ minHeight: 2 }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-1 flex-col gap-2 rounded-lg border border-white/8 bg-white/[0.02] p-2.5 sm:gap-2.5 sm:p-3">
            {[0, 1, 2].map((row) => (
              <motion.div
                key={row}
                className="flex items-center gap-2.5"
                initial={reduced ? false : { opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewport}
                transition={{
                  duration: 0.5,
                  delay: 0.3 + row * 0.1,
                  ease: easeBrand,
                }}
              >
                <span
                  className={cn(
                    "size-4 shrink-0 rounded-md",
                    row === 0
                      ? "bg-brand-cyan/30"
                      : row === 1
                        ? "bg-brand-violet/30"
                        : "bg-white/10",
                  )}
                />
                <span className="h-1.5 flex-1 rounded-full bg-white/12" />
                <span className="hidden h-1.5 w-10 rounded-full bg-white/8 sm:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ------------------------------------------------------------------ */
/*  02 — LearnOnline : learning progress                               */
/* ------------------------------------------------------------------ */

export function LearnOnlineVisual() {
  const reduced = useReducedMotion();
  const lessons = [
    { label: 92, tone: "from-brand-violet to-brand-indigo" },
    { label: 64, tone: "from-brand-indigo to-brand-blue" },
    { label: 38, tone: "from-brand-blue to-brand-cyan" },
  ];

  const circumference = 2 * Math.PI * 42;
  const progress = 0.72;

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-canvas-raised/95 p-4 shadow-[0_40px_90px_-50px_rgba(0,0,0,1)] sm:p-6">
        <Sheen />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[0.5625rem] tracking-[0.2em] text-white/40 uppercase">
              Course progress
            </p>
            <div className="mt-2 h-2.5 w-28 rounded-full bg-white/15 sm:w-36" />
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[0.5625rem] text-white/50">
            Module 04
          </span>
        </div>

        <div className="mt-5 flex items-center gap-5 sm:mt-7 sm:gap-7">
          {/* progress ring */}
          <div className="relative shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="size-20 -rotate-90 sm:size-24"
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                className="text-white/8"
                strokeWidth="6"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#learn-ring)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={reduced ? false : { strokeDashoffset: circumference }}
                whileInView={{
                  strokeDashoffset: circumference * (1 - progress),
                }}
                viewport={viewport}
                transition={{ duration: 1.3, ease: easeBrand, delay: 0.15 }}
                style={{
                  strokeDashoffset: reduced
                    ? circumference * (1 - progress)
                    : undefined,
                }}
              />
              <defs>
                <linearGradient id="learn-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white sm:text-base">
              72%
            </span>
          </div>

          {/* lesson bars */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
            {lessons.map((lesson, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="h-1.5 w-16 rounded-full bg-white/14 sm:w-24" />
                  <span className="font-mono text-[0.5625rem] text-white/35">
                    {lesson.label}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    className={cn(
                      "h-full rounded-full bg-linear-to-r",
                      lesson.tone,
                    )}
                    initial={reduced ? false : { width: "0%" }}
                    whileInView={{ width: `${lesson.label}%` }}
                    viewport={viewport}
                    transition={{
                      duration: 1,
                      delay: 0.25 + i * 0.12,
                      ease: easeBrand,
                    }}
                    style={reduced ? { width: `${lesson.label}%` } : undefined}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-white/8 bg-white/[0.025] p-2.5 sm:p-3"
            >
              <div className="h-1.5 w-10 rounded-full bg-white/14" />
              <div className="mt-2 h-1 w-full rounded-full bg-white/7" />
              <div className="mt-1.5 h-1 w-2/3 rounded-full bg-white/7" />
            </div>
          ))}
        </div>
      </div>

      {/* floating completion chip */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 14, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={viewport}
        transition={{ duration: 0.6, delay: 0.7, ease: easeBrand }}
        className="absolute -right-2 -bottom-4 flex items-center gap-2 rounded-xl border border-white/12 bg-canvas/90 px-3 py-2.5 shadow-[0_24px_60px_-30px_rgba(0,0,0,1)] backdrop-blur-xl sm:-right-5 sm:-bottom-5"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-linear-to-br from-brand-violet to-brand-cyan">
          <Check aria-hidden="true" className="size-3.5 text-white" />
        </span>
        <span className="text-[0.6875rem] font-medium text-white/80">
          Lesson complete
        </span>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  03 — AI Career OS : reasoning graph                                */
/* ------------------------------------------------------------------ */

const nodes = [
  { x: 24, y: 34, r: 5 },
  { x: 24, y: 96, r: 4 },
  { x: 24, y: 152, r: 4 },
  { x: 128, y: 92, r: 11 },
  { x: 236, y: 44, r: 5 },
  { x: 236, y: 100, r: 4.5 },
  { x: 236, y: 150, r: 4 },
];

const edges = [
  "M24 34 C 74 34, 78 92, 128 92",
  "M24 96 L 128 92",
  "M24 152 C 74 152, 78 92, 128 92",
  "M128 92 C 180 92, 186 44, 236 44",
  "M128 92 L 236 100",
  "M128 92 C 180 92, 186 150, 236 150",
];

export function AICareerOSVisual({ url }: { url: string }) {
  const reduced = useReducedMotion();

  return (
    <BrowserFrame url={url} className="relative">
      <Sheen />
      <div className="relative aspect-16/11 p-3 sm:p-4">
        <div className="grid-backdrop-sm absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]" />

        <div className="relative flex h-full flex-col">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-md bg-linear-to-br from-brand-blue to-brand-violet">
              <Sparkles aria-hidden="true" className="size-3 text-white" />
            </span>
            <span className="h-1.5 w-20 rounded-full bg-white/16 sm:w-28" />
            <span className="ml-auto hidden h-5 w-14 rounded-md border border-white/10 bg-white/[0.04] sm:block" />
          </div>

          <div className="relative flex-1">
            <svg
              viewBox="0 0 260 186"
              className="absolute inset-0 size-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="edge-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4c7dff" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.15" />
                </linearGradient>
                <radialGradient id="core-grad">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#6366f1" />
                </radialGradient>
              </defs>

              {edges.map((d, i) => (
                <g key={i}>
                  <path
                    d={d}
                    fill="none"
                    stroke="url(#edge-grad)"
                    strokeWidth="1"
                  />
                  {reduced ? null : (
                    <circle r="1.8" fill="#22d3ee" opacity="0.9">
                      <animateMotion
                        dur="2.8s"
                        begin={`${i * 0.45}s`}
                        repeatCount="indefinite"
                        path={d}
                        keyPoints="0;1"
                        keyTimes="0;1"
                        calcMode="linear"
                      />
                      <animate
                        attributeName="opacity"
                        values="0;0.9;0.9;0"
                        dur="2.8s"
                        begin={`${i * 0.45}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              ))}

              {nodes.map((node, i) => (
                <motion.circle
                  key={i}
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={i === 3 ? "url(#core-grad)" : "#0c0e18"}
                  stroke={i === 3 ? "none" : "rgba(255,255,255,0.28)"}
                  strokeWidth="1"
                  initial={reduced ? false : { scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={viewport}
                  transition={{
                    duration: 0.5,
                    delay: 0.1 + i * 0.07,
                    ease: easeBrand,
                  }}
                  style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                />
              ))}
            </svg>
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2">
            <span className="size-1.5 shrink-0 rounded-full bg-brand-cyan" />
            <span className="h-1.5 flex-1 rounded-full bg-white/12" />
            <span className="h-1.5 w-8 rounded-full bg-white/8" />
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
