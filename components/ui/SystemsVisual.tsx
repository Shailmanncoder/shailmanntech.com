import { Cloud, Layers, Network } from "lucide-react";
import { cn } from "@/lib/utils";

const layers = [
  {
    label: "Interface",
    icon: Layers,
    className: "top-[6%] left-0 sm:left-[2%]",
    delay: "0s",
  },
  {
    label: "Services & APIs",
    icon: Network,
    className: "top-1/2 right-0 -translate-y-1/2 sm:right-[1%]",
    delay: "-2.4s",
  },
  {
    label: "Infrastructure",
    icon: Cloud,
    className: "bottom-[6%] left-[4%] sm:left-[6%]",
    delay: "-4.6s",
  },
];

/**
 * Abstract representation of the systems behind a product: a core surrounded by
 * orbiting services and infrastructure. Pure CSS/SVG — transforms only, so it
 * stays cheap, and the global reduced-motion rule freezes it gracefully.
 */
export function SystemsVisual({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-square w-full max-w-md lg:max-w-lg",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[2rem] border border-white/8 bg-white/[0.015]"
      >
        <div className="grid-backdrop-sm absolute inset-0 rounded-[2rem] opacity-40 [mask-image:radial-gradient(ellipse_68%_68%_at_50%_50%,black,transparent)]" />
        <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.14),transparent_62%)]" />
      </div>

      {/* orbits */}
      <div
        aria-hidden="true"
        className="absolute inset-[14%] rounded-full border border-dashed border-white/12 animate-orbit"
      >
        <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-brand-cyan shadow-[0_0_14px_2px_rgba(34,211,238,0.6)]" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-[26%] rounded-full border border-white/8 animate-orbit-reverse"
      >
        <span className="absolute top-1/2 -right-1 size-1.5 -translate-y-1/2 rounded-full bg-brand-violet shadow-[0_0_12px_2px_rgba(139,92,246,0.6)]" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-[38%] rounded-full border border-dashed border-white/10 animate-orbit"
        style={{ animationDuration: "22s" }}
      >
        <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-brand-blue shadow-[0_0_12px_2px_rgba(76,125,255,0.6)]" />
      </div>

      {/* core */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-linear-to-br from-brand-cyan via-brand-blue to-brand-violet shadow-[0_0_60px_-10px_rgba(99,102,241,0.9)] sm:size-20"
      >
        <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/25" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-7 sm:size-9"
        >
          <path d="M9.5 9 7 12l2.5 3" />
          <path d="M14.5 9 17 12l-2.5 3" />
        </svg>
      </div>

      {/* layer chips */}
      {layers.map(({ label, icon: Icon, className: position, delay }) => (
        <div
          key={label}
          className={cn(
            "absolute flex items-center gap-2 rounded-xl border border-white/10 bg-canvas/85 px-2.5 py-2 backdrop-blur-md animate-float sm:px-3",
            position,
          )}
          style={{ animationDelay: delay }}
        >
          <Icon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-brand-cyan sm:size-4"
            strokeWidth={1.6}
          />
          <span className="text-[0.625rem] font-medium whitespace-nowrap text-white/75 sm:text-xs">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
