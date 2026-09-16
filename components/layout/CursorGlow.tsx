"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useEffect, useState } from "react";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";

/**
 * A very subtle radial glow that trails the pointer. Desktop only — it never
 * mounts on touch devices or when the visitor prefers reduced motion, and it
 * never replaces the native cursor.
 */
export function CursorGlow() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const [visible, setVisible] = useState(false);

  const springX = useSpring(x, { stiffness: 190, damping: 28, mass: 0.45 });
  const springY = useSpring(y, { stiffness: 190, damping: 28, mass: 0.45 });

  const background = useMotionTemplate`radial-gradient(420px circle at ${springX}px ${springY}px, rgba(99,102,241,0.10), rgba(34,211,238,0.05) 38%, transparent 62%)`;

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 hidden lg:block"
      style={{ background }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4 }}
    />
  );
}
