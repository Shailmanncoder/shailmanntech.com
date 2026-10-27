"use client";

import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The bell for the admin and the client portal: unread count, a list of the
 * latest notifications, and (once allowed) a desktop pop-up for each new one.
 * It checks for new ones every 30 seconds while the page is visible.
 */

export type BellNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string;
  createdAt: string;
  read: boolean;
};

type Feed = { unread: number; notifications: BellNotification[] };

const POLL_MS = 30_000;

function ago(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7
    ? `${days}d ago`
    : new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      });
}

function desktopAllowed() {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

export function NotificationBell({
  endpoint,
  onOpen,
  className,
  align = "right",
}: {
  /** GET lists, POST { id } marks read. */
  endpoint: string;
  /** Opens a notification's link. */
  onOpen: (link: string) => void;
  className?: string;
  /** Which edge of the bell the panel lines up with. */
  align?: "left" | "right";
}) {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const seen = useRef<Set<string> | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) return;
      const data = (await response.json()) as Feed;
      // Pop up anything new since the last check (not what was there on load).
      if (seen.current && desktopAllowed()) {
        for (const n of data.notifications) {
          if (n.read || seen.current.has(n.id)) continue;
          const popup = new Notification(n.title, {
            body: n.body,
            icon: "/icon.png",
            tag: `notification-${n.id}`,
          });
          popup.onclick = () => {
            window.focus();
            onOpenRef.current(n.link);
            popup.close();
          };
        }
      }
      seen.current = new Set(data.notifications.map((n) => n.id));
      setFeed(data);
    } catch {
      // Offline for a moment: the next check catches up.
    }
  }, [endpoint]);

  useEffect(() => {
    const start = setTimeout(() => {
      setPermission(
        typeof Notification === "undefined" ? "unsupported" : Notification.permission,
      );
      load();
    }, 0);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markRead(id: string) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) setFeed((await response.json()) as Feed);
    } catch {
      // Not critical: it stays unread.
    }
  }

  async function enableDesktop() {
    if (typeof Notification === "undefined") return;
    setPermission(await Notification.requestPermission());
  }

  const unread = feed?.unread ?? 0;
  const Icon = unread > 0 ? BellRing : Bell;

  return (
    <div ref={wrapper} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
      >
        <Icon aria-hidden="true" className="size-[1.125rem]" />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[0.6875rem] leading-5 font-semibold text-white tabular-nums">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className={cn(
            "absolute top-12 z-50 w-96 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d16] shadow-2xl",
            // Phones: full width under the header, whatever side the bell is on.
            "max-sm:fixed max-sm:inset-x-4 max-sm:top-20 max-sm:w-auto",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => markRead("all")}
                className="flex items-center gap-1 text-xs text-cyan-200 hover:text-white"
              >
                <CheckCheck aria-hidden="true" className="size-3.5" />
                Mark all read
              </button>
            ) : null}
          </div>

          {permission === "default" ? (
            <button
              type="button"
              onClick={enableDesktop}
              className="block w-full border-b border-white/[0.08] bg-brand-cyan/[0.06] px-4 py-2.5 text-left text-xs text-cyan-100 hover:bg-brand-cyan/[0.1]"
            >
              Turn on pop-up alerts on this device →
            </button>
          ) : null}

          <ul className="max-h-[min(28rem,70svh)] overflow-y-auto">
            {feed === null ? (
              <li className="px-4 py-8 text-center text-sm text-white/50">Loading…</li>
            ) : feed.notifications.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-white/55">
                You&rsquo;re all caught up.
              </li>
            ) : (
              feed.notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                      setOpen(false);
                      if (n.link) onOpen(n.link);
                    }}
                    className={cn(
                      "flex w-full gap-3 border-b border-white/[0.05] px-4 py-3 text-left transition-colors hover:bg-white/[0.04]",
                      !n.read && "bg-brand-cyan/[0.04]",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-brand-cyan",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm",
                          n.read ? "text-white/70" : "font-medium text-white",
                        )}
                      >
                        {n.title}
                      </span>
                      {n.body ? (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-white/55">
                          {n.body}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-[0.6875rem] text-white/40">
                        {ago(n.createdAt)}
                        {n.read ? "" : <span className="sr-only"> · unread</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
