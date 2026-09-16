import type { ReactNode, SVGProps } from "react";
import type { TechKey } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * An original, house-designed glyph set for the technologies Shellman Tech
 * works with. Drawn on a shared 24x24 grid with lucide-matching stroke weights
 * so icons across the site read as one family — and shipped inline so the tech
 * sections cost no extra dependency or network request.
 */

const label = (text: string, size: number) => (
  <text
    x="12"
    y="12"
    textAnchor="middle"
    dominantBaseline="central"
    fontSize={size}
    fontWeight={700}
    letterSpacing="0.02em"
    fill="currentColor"
    stroke="none"
  >
    {text}
  </text>
);

const frame = <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="4.5" />;

const glyphs: Record<TechKey, ReactNode> = {
  nextjs: (
    <>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M9.4 16.1V8.2l6.1 7.9" />
      <path d="M15.2 8.2v5" />
    </>
  ),
  react: (
    <>
      <circle cx="12" cy="12" r="1.9" />
      <ellipse cx="12" cy="12" rx="9.4" ry="3.7" />
      <ellipse cx="12" cy="12" rx="9.4" ry="3.7" transform="rotate(60 12 12)" />
      <ellipse
        cx="12"
        cy="12"
        rx="9.4"
        ry="3.7"
        transform="rotate(120 12 12)"
      />
    </>
  ),
  typescript: (
    <>
      {frame}
      {label("TS", 8.5)}
    </>
  ),
  javascript: (
    <>
      {frame}
      {label("JS", 8.5)}
    </>
  ),
  nodejs: (
    <>
      <path d="M12 2.7 20 7.35v9.3L12 21.3 4 16.65v-9.3z" />
      <path d="M9.6 15.2v-6l4.8 6v-6" />
    </>
  ),
  aws: (
    <>
      {frame}
      {label("AWS", 6.2)}
    </>
  ),
  docker: (
    <>
      <rect x="4.2" y="11.1" width="3.1" height="3.1" rx="0.5" />
      <rect x="8.1" y="11.1" width="3.1" height="3.1" rx="0.5" />
      <rect x="12" y="11.1" width="3.1" height="3.1" rx="0.5" />
      <rect x="8.1" y="7.3" width="3.1" height="3.1" rx="0.5" />
      <rect x="12" y="7.3" width="3.1" height="3.1" rx="0.5" />
      <path d="M3 15.4c1.3 2.9 4.1 4.4 7.6 4.4 4.6 0 8.1-2.3 9.6-6.3-1.2-.7-2.7-.8-4-.4" />
    </>
  ),
  linux: (
    <>
      <path d="M9.1 10.6c-.5 2.3-1.4 4.2-2.5 5.7-1 1.4-.4 3 1.3 3h8.2c1.7 0 2.3-1.6 1.3-3-1.1-1.5-2-3.4-2.5-5.7" />
      <path d="M8.7 8.6a3.3 3.9 0 1 1 6.6 0 3.3 3.9 0 0 1-6.6 0Z" />
      <path d="M10.7 7.6h.01M13.3 7.6h.01" />
      <path d="M11 9.9c.6.5 1.4.5 2 0" />
    </>
  ),
  git: (
    <>
      <rect
        x="4.85"
        y="4.85"
        width="14.3"
        height="14.3"
        rx="2.4"
        transform="rotate(45 12 12)"
      />
      <path d="M9.4 14.6 14.6 9.4" />
      <circle cx="9.4" cy="14.6" r="1.5" />
      <circle cx="14.6" cy="9.4" r="1.5" />
      <path d="M12 12h2.6" />
    </>
  ),
  github: (
    <>
      {frame}
      <circle cx="9" cy="8.6" r="1.5" />
      <circle cx="9" cy="15.4" r="1.5" />
      <circle cx="15.4" cy="10.4" r="1.5" />
      <path d="M9 10.1v3.8" />
      <path d="M15.4 11.9v.6a2.4 2.4 0 0 1-2.4 2.4h-2.5" />
    </>
  ),
  html: (
    <>
      <path d="M9.3 8.4 5.9 12l3.4 3.6" />
      <path d="M14.7 8.4 18.1 12l-3.4 3.6" />
      <path d="M13.2 6.6 10.8 17.4" />
    </>
  ),
  css: (
    <>
      <path d="M10.4 5.6c-2 0-2.1 2.4-2.1 3.6 0 1.6-.6 2.8-2 2.8 1.4 0 2 1.2 2 2.8 0 1.2.1 3.6 2.1 3.6" />
      <path d="M13.6 5.6c2 0 2.1 2.4 2.1 3.6 0 1.6.6 2.8 2 2.8-1.4 0-2 1.2-2 2.8 0 1.2-.1 3.6-2.1 3.6" />
    </>
  ),
  tailwind: (
    <>
      <path d="M4 10.6c1.1-3.2 3-4.8 5.7-4.8 4 0 4.5 3 6.5 3.5 1.4.4 2.6-.1 3.6-1.5-1.1 3.2-3 4.8-5.7 4.8-4 0-4.5-3-6.5-3.5-1.4-.4-2.6.1-3.6 1.5Z" />
      <path d="M4 17c1.1-3.2 3-4.8 5.7-4.8 4 0 4.5 3 6.5 3.5 1.4.4 2.6-.1 3.6-1.5-1.1 3.2-3 4.8-5.7 4.8-4 0-4.5-3-6.5-3.5-1.4-.4-2.6.1-3.6 1.5Z" />
    </>
  ),
  rest: (
    <>
      <path d="M8.6 4.8 5.2 8.2v7.6l3.4 3.4" />
      <path d="M15.4 4.8l3.4 3.4v7.6l-3.4 3.4" />
      <path d="M9.4 12h5.2" />
      <path d="m11 10.3-1.7 1.7 1.7 1.7" />
      <path d="m13 13.7 1.7-1.7L13 10.3" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6.4" rx="7" ry="2.9" />
      <path d="M5 6.4v11.2c0 1.6 3.1 2.9 7 2.9s7-1.3 7-2.9V6.4" />
      <path d="M5 12c0 1.6 3.1 2.9 7 2.9s7-1.3 7-2.9" />
    </>
  ),
  vercel: (
    <>
      <path d="M12 4.4 21 19.6H3z" />
    </>
  ),
};

type TechGlyphProps = SVGProps<SVGSVGElement> & {
  name: TechKey;
  className?: string;
};

export function TechGlyph({ name, className, ...rest }: TechGlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("size-6 shrink-0", className)}
      {...rest}
    >
      {glyphs[name]}
    </svg>
  );
}
