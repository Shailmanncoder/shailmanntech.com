import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/portal/projects";

export const STATUS_TEXT: Record<ProjectStatus, string> = {
  submitted: "Submitted",
  reviewing: "We're reviewing it",
  proposal: "Proposal sent",
  in_progress: "In progress",
  in_review: "Ready for your review",
  completed: "Completed",
  on_hold: "On hold",
  declined: "Not taken on",
};

const TONES: Record<ProjectStatus, string> = {
  submitted: "border-white/15 bg-white/[0.06] text-white/80",
  reviewing: "border-sky-300/25 bg-sky-300/10 text-sky-100",
  proposal: "border-violet-300/25 bg-violet-300/10 text-violet-100",
  in_progress: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  in_review: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  completed: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  on_hold: "border-white/15 bg-white/[0.04] text-white/70",
  declined: "border-white/15 bg-white/[0.04] text-white/60",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[status],
      )}
    >
      {STATUS_TEXT[status]}
    </span>
  );
}

export function ProgressBar({
  value,
  label = true,
}: {
  value: number;
  label?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress"
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-brand-cyan to-brand-violet transition-[width] duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      {label ? (
        <span className="w-9 text-right text-xs text-white/60 tabular-nums">
          {value}%
        </span>
      ) : null}
    </div>
  );
}

export function formatWhen(iso: string, withTime = false) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: withTime ? "numeric" : undefined,
    minute: withTime ? "2-digit" : undefined,
  });
}

/**
 * A date in the reader's own locale and time zone. The server can't know
 * either, so the browser's version replaces it without a hydration warning.
 */
export function When({
  iso,
  withTime = false,
}: {
  iso: string;
  withTime?: boolean;
}) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {formatWhen(iso, withTime)}
    </time>
  );
}
