import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Full-bleed decoration rendered behind the container. */
  backdrop?: ReactNode;
  /** Hairline divider above the section. */
  divider?: boolean;
  "aria-labelledby"?: string;
};

export function Section({
  id,
  children,
  className,
  backdrop,
  divider,
  ...rest
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-24 py-20 sm:py-24 lg:py-32 xl:py-36",
        className,
      )}
      {...rest}
    >
      {divider ? (
        <div
          aria-hidden="true"
          className="rule-fade absolute inset-x-0 top-0 h-px"
        />
      ) : null}
      {backdrop ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {backdrop}
        </div>
      ) : null}
      <div className="container-page relative">{children}</div>
    </section>
  );
}
