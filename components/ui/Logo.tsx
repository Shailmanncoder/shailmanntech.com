import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/** The Shailmann Tech mark: a folded-ribbon "S" in the brand blues. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-mark.png"
      alt=""
      aria-hidden="true"
      width={64}
      height={64}
      priority
      className={cn("size-8 shrink-0 object-contain", className)}
    />
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
