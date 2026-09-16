import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/**
 * The Shailmann Tech mark: a terminal prompt set in the brand gradient — a nod
 * to the "shell" in Shailmann and to the engineering work underneath the brand.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn("size-8 shrink-0", className)}
    >
      <defs>
        <linearGradient id="shailmann-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="52%" stopColor="#4c7dff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#shailmann-mark)" />
      <rect
        x="0.6"
        y="0.6"
        width="30.8"
        height="30.8"
        rx="8.6"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.25"
      />
      <path
        d="M10.5 11.5 15 16l-4.5 4.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 20.5h5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group/logo inline-flex items-center gap-2.5 rounded-xl",
        className,
      )}
      aria-label={`${site.name} — home`}
    >
      <LogoMark className="size-8 transition-transform duration-500 ease-out group-hover/logo:scale-105 motion-reduce:transition-none motion-reduce:group-hover/logo:scale-100" />
      <span className="text-[0.975rem] tracking-[-0.015em] whitespace-nowrap">
        <span className="font-semibold text-white">Shailmann</span>{" "}
        <span className="font-medium text-white/55 transition-colors duration-300 group-hover/logo:text-white/80">
          Tech
        </span>
      </span>
    </Link>
  );
}
