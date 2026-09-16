"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "transition-[transform,background-color,box-shadow,border-color,color] duration-300 ease-out " +
  "will-change-transform active:scale-[0.98] motion-reduce:active:scale-100 " +
  "disabled:pointer-events-none disabled:opacity-60 " +
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-cyan";

const variants: Record<Variant, string> = {
  primary:
    "bg-linear-to-r from-[#3a5cf0] to-[#7c3aed] text-white " +
    "shadow-[0_10px_34px_-14px_rgba(99,102,241,0.9)] " +
    "hover:shadow-[0_16px_46px_-14px_rgba(124,58,237,0.95)] " +
    "hover:scale-[1.025] motion-reduce:hover:scale-100 " +
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-full " +
    "after:ring-1 after:ring-inset after:ring-white/25",
  secondary:
    "bg-white/[0.04] text-white/90 ring-1 ring-inset ring-white/12 backdrop-blur-sm " +
    "hover:bg-white/[0.08] hover:text-white hover:ring-white/25 " +
    "hover:scale-[1.025] motion-reduce:hover:scale-100",
  ghost:
    "text-white/70 hover:text-white ring-1 ring-inset ring-transparent hover:ring-white/12",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-12 px-6 text-[0.9375rem] sm:h-13 sm:px-7 sm:text-base",
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** "right" nudges the arrow horizontally, "up-right" for external links. */
  arrow?: "right" | "up-right" | "none";
  href?: string;
  external?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
};

function Inner({
  children,
  arrow,
}: {
  children: ReactNode;
  arrow: CommonProps["arrow"];
}) {
  return (
    <>
      <span className="relative z-10">{children}</span>
      {arrow === "right" ? (
        <ArrowRight
          aria-hidden="true"
          className="relative z-10 size-4 transition-transform duration-300 ease-out group-hover/btn:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover/btn:translate-x-0"
        />
      ) : arrow === "up-right" ? (
        <ArrowUpRight
          aria-hidden="true"
          className="relative z-10 size-4 transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover/btn:translate-x-0 motion-reduce:group-hover/btn:translate-y-0"
        />
      ) : null}
    </>
  );
}

export function ActionButton({
  children,
  variant = "primary",
  size = "md",
  className,
  arrow = "none",
  href,
  external,
  onClick,
  ...rest
}: CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  const classes = cn(base, variants[variant], sizes[size], className);
  const isExternal =
    external ?? (!!href && !href.startsWith("/") && !href.startsWith("#"));

  if (href) {
    if (isExternal) {
      return (
        <a
          href={href}
          className={classes}
          onClick={onClick}
          {...(href.startsWith("mailto:")
            ? {}
            : { target: "_blank", rel: "noopener noreferrer" })}
        >
          <Inner arrow={arrow}>{children}</Inner>
        </a>
      );
    }
    return (
      <Link href={href} className={classes} onClick={onClick}>
        <Inner arrow={arrow}>{children}</Inner>
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} {...rest}>
      <Inner arrow={arrow}>{children}</Inner>
    </button>
  );
}
