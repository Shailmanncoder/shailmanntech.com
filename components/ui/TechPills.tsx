import { cn } from "@/lib/utils";

/** Compact list of technology labels used under products and services. */
export function TechPills({
  items,
  className,
  size = "md",
}: {
  items: string[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition-colors duration-300",
            size === "sm"
              ? "px-2.5 py-1 text-[0.6875rem]"
              : "px-3 py-1.5 text-xs",
          )}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
