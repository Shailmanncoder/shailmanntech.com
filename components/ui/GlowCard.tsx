"use client";

import {
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type GlowCardProps = {
  children: ReactNode;
  className?: string;
  /** Colour of the cursor-following glow. */
  glow?: string;
  /** Radius of the glow in px. */
  radius?: number;
  style?: CSSProperties;
};

/**
 * Card whose border brightens on hover and whose background glow follows the
 * pointer. The pointer position is written straight to CSS custom properties so
 * the effect never triggers a React re-render.
 */
export function GlowCard({
  children,
  className,
  glow = "rgba(99,102,241,0.22)",
  radius = 420,
  style,
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || event.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      style={
        {
          "--glow": glow,
          "--glow-radius": `${radius}px`,
          ...style,
        } as CSSProperties
      }
      className={cn(
        "group/card relative isolate overflow-hidden rounded-2xl",
        "bg-white/[0.022] ring-1 ring-inset ring-white/8",
        "transition-[background-color,box-shadow,transform] duration-500 ease-out",
        "hover:bg-white/[0.04] hover:ring-white/18",
        "hover:shadow-[0_24px_70px_-40px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 ease-out group-hover/card:opacity-100 motion-reduce:transition-none"
        style={{
          background:
            "radial-gradient(var(--glow-radius) circle at var(--mx, 50%) var(--my, 0%), var(--glow), transparent 68%)",
        }}
      />
      {children}
    </div>
  );
}
