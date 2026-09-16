"use client";

import { motion } from "framer-motion";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { easeBrand } from "./Reveal";
import { useReducedMotion } from "@/lib/hooks";

export type TextSegment = {
  text: string;
  /** Render this segment with the animated brand gradient. */
  gradient?: boolean;
  /** Break to a new line after this segment (wide screens only). */
  breakAfter?: boolean;
};

type AnimatedTextProps = {
  segments: TextSegment[];
  className?: string;
  delay?: number;
  /** Seconds between each word. */
  stagger?: number;
};

/**
 * Masked word-by-word reveal. Only transform + opacity animate, and with
 * reduced motion the text renders immediately with its gradient intact.
 */
export function AnimatedText({
  segments,
  className,
  delay = 0,
  stagger = 0.05,
}: AnimatedTextProps) {
  const reduced = useReducedMotion();
  let wordIndex = 0;

  return (
    <span className={cn("block", className)}>
      {segments.map((segment, si) => {
        const words = segment.text.split(" ").filter(Boolean);

        return (
          <Fragment key={si}>
            {words.map((word, wi) => {
              const index = wordIndex++;
              const word_ = (
                <span
                  className={cn(
                    "inline-block",
                    segment.gradient && "text-gradient",
                  )}
                >
                  {word}
                </span>
              );

              return (
                <Fragment key={`${si}-${wi}`}>
                  <span className="inline-block overflow-hidden pb-[0.16em] -mb-[0.16em] align-bottom">
                    {reduced ? (
                      word_
                    ) : (
                      <motion.span
                        className="inline-block will-change-transform"
                        initial={{ y: "115%", opacity: 0 }}
                        animate={{ y: "0%", opacity: 1 }}
                        transition={{
                          duration: 0.85,
                          delay: delay + index * stagger,
                          ease: easeBrand,
                        }}
                      >
                        {word_}
                      </motion.span>
                    )}
                  </span>
                  {wi < words.length - 1 ? " " : null}
                </Fragment>
              );
            })}

            {segment.breakAfter ? (
              <>
                <br className="hidden sm:block" aria-hidden="true" />
                <span className="sm:hidden"> </span>
              </>
            ) : si < segments.length - 1 ? (
              " "
            ) : null}
          </Fragment>
        );
      })}
    </span>
  );
}
