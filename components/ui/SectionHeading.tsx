import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  /** Rendered to the right of the title block on large screens. */
  action?: ReactNode;
  className?: string;
  /** Use h1 on routes where this is the page's primary heading. */
  as?: "h1" | "h2";
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
  as: Tag = "h2",
  id,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between",
        centered && "lg:flex-col lg:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto text-center")}>
        {eyebrow ? (
          <Reveal y={14}>
            <p
              className={cn(
                "flex items-center gap-3 font-mono text-[0.6875rem] font-medium tracking-[0.22em] text-white/55 uppercase",
                centered && "justify-center",
              )}
            >
              <span
                aria-hidden="true"
                className="h-px w-8 bg-linear-to-r from-brand-cyan to-brand-violet"
              />
              {eyebrow}
            </p>
          </Reveal>
        ) : null}

        <Reveal delay={0.06}>
          <Tag
            id={id}
            className={cn(
              "mt-5 text-3xl leading-[1.08] font-semibold tracking-[-0.025em] text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]",
            )}
          >
            {title}
          </Tag>
        </Reveal>

        {description ? (
          <Reveal delay={0.12}>
            <div className="mt-6 text-base leading-relaxed text-white/60 sm:text-lg">
              {description}
            </div>
          </Reveal>
        ) : null}
      </div>

      {action ? (
        <Reveal delay={0.18} className={cn("shrink-0", centered && "mt-2")}>
          {action}
        </Reveal>
      ) : null}
    </div>
  );
}
