"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/lib/hooks";

const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  ul: motion.ul,
  p: motion.p,
  span: motion.span,
  h2: motion.h2,
  h3: motion.h3,
  figure: motion.figure,
} as const;

type MotionTag = keyof typeof MOTION_TAGS;

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds before the reveal starts. */
  delay?: number;
  /** Travel distance in px. */
  y?: number;
  as?: MotionTag;
  /** Fraction of the element that must be visible to trigger. */
  amount?: number;
};

/**
 * Scroll-triggered entrance. Animates transform + opacity only, and collapses
 * to a plain element when the visitor prefers reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
  amount = 0.25,
}: RevealProps) {
  const reduced = useReducedMotion();
  const Tag = MOTION_TAGS[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

/** Parent that drives a staggered entrance across its StaggerItem children. */
export function StaggerGroup({
  children,
  className,
  as = "div",
  amount = 0.15,
  stagger = 0.08,
}: Omit<RevealProps, "delay" | "y"> & { stagger?: number }) {
  const reduced = useReducedMotion();
  const Tag = MOTION_TAGS[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      className={className}
      variants={{
        ...groupVariants,
        show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
      }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount, margin: "0px 0px -6% 0px" }}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: Omit<RevealProps, "delay" | "y" | "amount">) {
  const reduced = useReducedMotion();
  const Tag = MOTION_TAGS[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag className={className} variants={itemVariants}>
      {children}
    </Tag>
  );
}

/** Shared easing so bespoke animations stay in the same motion language. */
export const easeBrand = EASE;
