import {
  CircleCheck,
  CircleHelp,
  CircleX,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FitDecision } from "./client";

/** The AI's project-fit decision, always shown as icon + words, never colour alone. */
export const FIT_LABELS: Record<
  FitDecision,
  { label: string; short: string; icon: typeof CircleCheck; tone: string }
> = {
  yes: {
    label: "Good fit",
    short: "Fit",
    icon: CircleCheck,
    tone: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  },
  no: {
    label: "Not a fit",
    short: "No fit",
    icon: CircleX,
    tone: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  },
  info: {
    label: "Needs details",
    short: "Details?",
    icon: CircleHelp,
    tone: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  },
  other: {
    label: "Not a project",
    short: "Question",
    icon: MessageSquare,
    tone: "border-white/15 bg-white/[0.06] text-white/70",
  },
  spam: {
    label: "Looks like spam",
    short: "Spam?",
    icon: ShieldAlert,
    tone: "border-red-400/30 bg-red-400/10 text-red-200",
  },
};

export function FitBadge({
  decision,
  compact,
}: {
  decision: FitDecision;
  compact?: boolean;
}) {
  const meta = FIT_LABELS[decision];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border font-medium",
        compact
          ? "px-1.5 py-0.5 text-[0.625rem] tracking-wide uppercase"
          : "px-2 py-1 text-xs",
        meta.tone,
      )}
    >
      <Icon aria-hidden="true" className={compact ? "size-3" : "size-3.5"} />
      {compact ? meta.short : meta.label}
    </span>
  );
}
