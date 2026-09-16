"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  max?: number;
  /** Slight lift applied while the pointer is over the card. */
  lift?: number;
};

/** Adds a restrained 3D tilt that follows the pointer. Mouse-only. */
export function TiltCard({
  children,
  className,
  max = 5,
  lift = 6,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const hover = useMotionValue(0);

  const spring = { stiffness: 150, damping: 20, mass: 0.6 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [max, -max]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-max, max]), spring);
  const translateZ = useSpring(useTransform(hover, [0, 1], [0, lift]), spring);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || event.pointerType !== "mouse") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((event.clientX - rect.left) / rect.width - 0.5);
    my.set((event.clientY - rect.top) / rect.height - 0.5);
    hover.set(1);
  };

  const handleLeave = () => {
    mx.set(0);
    my.set(0);
    hover.set(0);
  };

  return (
    <div
      className={cn("[perspective:1400px]", className)}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <motion.div
        ref={ref}
        style={
          enabled
            ? { rotateX, rotateY, z: translateZ, transformStyle: "preserve-3d" }
            : undefined
        }
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
