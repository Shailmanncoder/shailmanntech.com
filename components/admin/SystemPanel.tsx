"use client";

import {
  Activity,
  CheckCheck,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  CircleX,
  LogOut,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { adminFetch, formatDate, relativeTime } from "./client";
import { Button, Card, ConfirmDialog, Skeleton, useToast } from "./ui";

type HealthStatus = "ok" | "warning" | "down" | "off";
type HealthCheck = {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
  ms?: number;
};
type AppError = {
  id: string;
  at: string;
  source: string;
  message: string;
  details: Record<string, unknown>;
};
type AuditEvent = {
  id: string;
  at: string;
  action: string;
  target: string | null;
  details: Record<string, unknown>;
  ip: string | null;
};
type SystemData = {
  checks: HealthCheck[];
  errors: AppError[];
  events: AuditEvent[];
  checkedAt: string;
};

const STATUS: Record<
  HealthStatus,
  { label: string; icon: typeof CircleCheck; tone: string }
> = {
  ok: { label: "Working", icon: CircleCheck, tone: "text-emerald-300" },
  warning: {
    label: "Needs attention",
    icon: TriangleAlert,
    tone: "text-amber-200",
  },
  down: { label: "Not working", icon: CircleX, tone: "text-red-300" },
  off: { label: "Not set up", icon: CircleMinus, tone: "text-white/50" },
};

const SOURCES: Record<string, string> = {
  "admin-api": "Admin",
  ai: "AI",
  config: "Settings",
  "contact-delivery": "Contact form",
  "contact-confirmation": "Confirmation email",
  "mailbox-sync": "Mailbox sync",
  "reply-send": "Sending a reply",
};

function describeEvent(event: AuditEvent) {
  const d = event.details;
  switch (event.action) {
    case "login":
      return "Signed in";
    case "login_failed":
      return `Failed sign-in${d.username ? ` as “${String(d.username)}”` : ""}`;
    case "logout":
      return "Signed out";
    case "sessions_revoked":
      return "Signed out all devices";
    case "reply_sent":
      return `Sent a reply to ${String(d.to ?? "a sender")}${d.duplicate ? " (repeat blocked)" : ""}`;
    case "message_updated": {
      const parts = [
        d.archived === true && "archived",
        d.archived === false && "moved to inbox",
        d.starred === true && "starred",
        d.starred === false && "unstarred",
        d.automated === true && "marked automated",
        d.automated === false && "marked as a person",
        d.status === "replied" && "marked replied",
        d.status === "new" && "marked unread",
      ].filter(Boolean);
      return parts.length ? `Email ${parts.join(", ")}` : "Opened an email";
    }
    case "rules_saved":
      return "Saved project rules";
    case "export_downloaded":
      return `Downloaded ${String(d.rows ?? "")} emails as CSV`;
    case "mail_synced":
      return `Imported ${String(d.imported)} new ${d.imported === 1 ? "email" : "emails"}`;
    case "errors_resolved":
      return "Cleared errors";
    default:
      return event.action;
  }
}

export function SystemPanel({
  onErrorsChanged,
}: {
  onErrorsChanged: () => void;
}) {
  const toast = useToast();
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  async function revokeSessions() {
    setConfirmRevoke(false);
    try {
      await adminFetch("/api/admin/sessions", { method: "DELETE" });
      // This device was signed out too; a full load clears everything.
      window.location.replace("/admin/login");
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't sign out.",
      });
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminFetch<SystemData>("/api/admin/system"));
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't load.",
      });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function resolve(body: { ids: string[] } | { all: true }) {
    try {
      await adminFetch("/api/admin/system/errors", { method: "POST", body });
      setData((current) =>
        current
          ? {
              ...current,
              errors:
                "all" in body
                  ? []
                  : current.errors.filter((e) => !body.ids.includes(e.id)),
            }
          : current,
      );
      onErrorsChanged();
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't update.",
      });
    }
  }

  const problems = data?.checks.filter(
    (c) => c.status === "down" || c.status === "warning",
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-[-0.03em] text-white">
            <Activity aria-hidden="true" className="size-5 text-cyan-200" />
            System
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {data
              ? problems?.length
                ? `${problems.length} ${problems.length === 1 ? "service needs" : "services need"} attention.`
                : "Everything is working."
              : "Checking every service…"}
          </p>
        </div>
        <Button onClick={load} disabled={loading}>
          <RefreshCw
            aria-hidden="true"
            className={cn("size-4", loading && "animate-spin")}
          />
          Check again
        </Button>
      </header>

      <Card className="overflow-hidden">
        <h2 className="border-b border-white/[0.06] px-5 py-4 text-sm font-semibold">
          Services
          {data ? (
            <span className="ml-2 font-normal text-white/50">
              checked {relativeTime(data.checkedAt)}
            </span>
          ) : null}
        </h2>
        <ul className="divide-y divide-white/[0.06]">
          {data
            ? data.checks.map((check) => {
                const meta = STATUS[check.status];
                const Icon = meta.icon;
                return (
                  <li
                    key={check.id}
                    className="flex items-start gap-3 px-5 py-4"
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn("mt-0.5 size-5 shrink-0", meta.tone)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        <span className="font-medium text-white">
                          {check.label}
                        </span>
                        <span className={cn("text-xs", meta.tone)}>
                          {meta.label}
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm break-words text-white/60">
                        {check.detail}
                      </p>
                    </div>
                    {check.ms !== undefined && check.status !== "off" ? (
                      <span className="shrink-0 text-xs text-white/50 tabular-nums">
                        {check.ms} ms
                      </span>
                    ) : null}
                  </li>
                );
              })
            : Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="flex gap-3 px-5 py-4">
                  <Skeleton className="size-5 rounded-full" />
                  <Skeleton className="h-10 flex-1" />
                </li>
              ))}
        </ul>
      </Card>

      <Card className="flex flex-wrap items-center gap-4 px-5 py-4">
        <ShieldCheck
          aria-hidden="true"
          className="size-5 shrink-0 text-cyan-200"
        />
        <div className="min-w-0 flex-1 basis-60">
          <h2 className="text-sm font-semibold text-white">
            Signed-in devices
          </h2>
          <p className="mt-0.5 text-sm text-white/60">
            Lost a device, or signed in somewhere you shouldn&rsquo;t have? End
            every admin session, including this one.
          </p>
        </div>
        <Button onClick={() => setConfirmRevoke(true)}>
          <LogOut aria-hidden="true" className="size-4" />
          Sign out all devices
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-sm font-semibold">
            Errors
            {data?.errors.length ? (
              <span className="ml-2 rounded-md bg-red-400/15 px-1.5 py-0.5 text-xs text-red-200 tabular-nums">
                {data.errors.length}
              </span>
            ) : null}
          </h2>
          {data?.errors.length ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => resolve({ all: true })}
            >
              <CheckCheck aria-hidden="true" className="size-3.5" />
              Mark all resolved
            </Button>
          ) : null}
        </div>
        {!data ? (
          <div className="p-5">
            <Skeleton className="h-16" />
          </div>
        ) : data.errors.length === 0 ? (
          <p className="flex items-center gap-2 px-5 py-6 text-sm text-white/60">
            <CircleCheck
              aria-hidden="true"
              className="size-4 text-emerald-300"
            />
            No unresolved errors.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {data.errors.map((error) => {
              const expanded = open === error.id;
              const hasDetails = Object.keys(error.details).length > 0;
              return (
                <li key={error.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-red-300"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-white/55">
                        <span className="font-medium text-white/80">
                          {SOURCES[error.source] ?? error.source}
                        </span>
                        <time dateTime={error.at}>
                          {formatDate(error.at, true)}
                        </time>
                      </p>
                      <p className="mt-1 text-sm break-words text-white/85">
                        {error.message}
                      </p>
                      {hasDetails ? (
                        <button
                          type="button"
                          onClick={() => setOpen(expanded ? null : error.id)}
                          aria-expanded={expanded}
                          className="mt-1.5 flex items-center gap-1 text-xs text-white/55 hover:text-white"
                        >
                          Details
                          <ChevronDown
                            aria-hidden="true"
                            className={cn(
                              "size-3 transition-transform",
                              expanded && "rotate-180",
                            )}
                          />
                        </button>
                      ) : null}
                      {expanded ? (
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-xs text-white/70">
                          {JSON.stringify(error.details, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resolve({ ids: [error.id] })}
                    >
                      Resolve
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="overflow-hidden">
        <h2 className="border-b border-white/[0.06] px-5 py-4 text-sm font-semibold">
          Activity
          <span className="ml-2 font-normal text-white/50">
            last 100 actions
          </span>
        </h2>
        {!data ? (
          <div className="p-5">
            <Skeleton className="h-24" />
          </div>
        ) : data.events.length === 0 ? (
          <p className="px-5 py-6 text-sm text-white/60">
            No activity recorded yet.
          </p>
        ) : (
          <ol className="divide-y divide-white/[0.04]">
            {data.events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 px-5 py-2.5 text-sm"
              >
                <time
                  dateTime={event.at}
                  className="w-32 shrink-0 text-xs text-white/50 tabular-nums"
                >
                  {formatDate(event.at, true)}
                </time>
                <span
                  className={cn(
                    "min-w-0 flex-1",
                    event.action === "login_failed"
                      ? "text-amber-100"
                      : "text-white/80",
                  )}
                >
                  {describeEvent(event)}
                </span>
                {event.ip ? (
                  <span className="shrink-0 font-mono text-xs text-white/50">
                    {event.ip}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Card>
      <ConfirmDialog
        open={confirmRevoke}
        title="Sign out all devices?"
        body="Every browser signed in to the admin, including this one, is signed out straight away. You'll need your password to sign back in."
        confirmLabel="Sign out everywhere"
        onConfirm={revokeSessions}
        onCancel={() => setConfirmRevoke(false)}
      />
    </div>
  );
}
