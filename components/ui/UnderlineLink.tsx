import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type UnderlineLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
};

/** Text link with an underline that wipes in from the left on hover/focus. */
export function UnderlineLink({
  href,
  children,
  className,
  external,
}: UnderlineLinkProps) {
  const isExternal =
    external ?? (!href.startsWith("/") && !href.startsWith("#"));

  const classes = cn(
    "group/link relative inline-flex items-center gap-1.5 text-sm font-medium text-white/70",
    "transition-colors duration-300 hover:text-white focus-visible:text-white",
    className,
  );

  const content = (
    <>
      <span className="relative">
        {children}
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-linear-to-r from-brand-cyan to-brand-violet transition-transform duration-400 ease-out group-hover/link:scale-x-100 group-focus-visible/link:scale-x-100 motion-reduce:transition-none"
        />
      </span>
    </>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        {...(href.startsWith("mailto:")
          ? {}
          : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
