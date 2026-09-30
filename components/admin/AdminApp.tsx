"use client";

import {
  Activity,
  AlertTriangle,
  Archive,
  Bot,
  CheckCheck,
  Clock,
  Download,
  FileText,
  Inbox,
  Keyboard,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MailSearch,
  RefreshCw,
  SlidersHorizontal,
  Search,
  Star,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LogoMark } from "@/components/ui/Logo";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  adminFetch,
  dateGroup,
  relativeTime,
  type InboxFilter,
  type InboxStats,
  type MessageSummary,
} from "./client";
import { useModalFocus } from "./useModalFocus";
import { MessagePanel } from "./MessagePanel";
import { FitBadge } from "./FitBadge";
import { Overview } from "./Overview";
import { RulesPanel } from "./RulesPanel";
import { SystemPanel } from "./SystemPanel";
import {
  Avatar,
  Badge,
  IconButton,
  Kbd,
  Skeleton,
  ToastProvider,
  useToast,
} from "./ui";

type Setup = {
  database: boolean;
  mailbox: boolean;
  ai: boolean;
  email: boolean;
};
type View = "overview" | "rules" | "system" | InboxFilter;

const FOLDERS: {
  key: InboxFilter;
  label: string;
  icon: typeof Inbox;
  count?: keyof InboxStats["counts"];
}[] = [
  { key: "all", label: "Inbox", icon: Inbox, count: "unread" },
  { key: "awaiting", label: "Awaiting reply", icon: Clock, count: "awaiting" },
  { key: "form", label: "Form requests", icon: FileText, count: "form" },
  { key: "starred", label: "Starred", icon: Star, count: "starred" },
  { key: "replied", label: "Replied", icon: CheckCheck },
  { key: "archived", label: "Archived", icon: Archive },
  { key: "automated", label: "Automated", icon: Bot },
];

const SETUP_LABELS: Record<keyof Setup, string> = {
  database: "database (DATABASE_URL)",
  mailbox: "mailbox (IMAP_USER, IMAP_PASSWORD)",
  ai: "AI (OPENAI_API_KEY)",
  email: "sending replies (RESEND_API_KEY)",
};

const SHORTCUTS: [string[], string][] = [
  [["j", "k"], "Next / previous email"],
  [["r"], "Reply"],
  [["e"], "Archive"],
  [["s"], "Star"],
  [["u"], "Mark unread"],
  [["/"], "Search"],
  [["⌘", "Enter"], "Send reply"],
  [["Esc"], "Close email"],
  [["?"], "Show shortcuts"],
];

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(
    el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.isContentEditable),
  );
}

export function AdminApp({ setup }: { setup: Setup }) {
  return (
    <ToastProvider>
      <AdminShell setup={setup} />
    </ToastProvider>
  );
}

function AdminShell({ setup }: { setup: Setup }) {
  const toast = useToast();
  const [view, setView] = useState<View>("overview");
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [messages, setMessages] = useState<MessageSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [sync, setSync] = useState({ running: false, imported: 0, error: "" });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const shortcutsRef = useRef<HTMLDivElement>(null);
  useModalFocus(showShortcuts, shortcutsRef);
  const syncing = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const isPage = view === "overview" || view === "rules" || view === "system";
  const folder: InboxFilter = isPage ? "all" : view;
  const missing = (Object.keys(setup) as (keyof Setup)[]).filter(
    (key) => !setup[key],
  );

  const loadStats = useCallback(async () => {
    if (!setup.database) return;
    try {
      setStats(await adminFetch<InboxStats>("/api/admin/stats"));
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't load stats.",
      });
    }
  }, [setup.database, toast]);

  const loadMessages = useCallback(async () => {
    if (!setup.database || isPage) return;
    const params = new URLSearchParams({ filter: folder, search });
    try {
      const data = await adminFetch<{ messages: MessageSummary[] }>(
        `/api/admin/messages?${params}`,
      );
      setMessages(data.messages);
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't load the inbox.",
      });
    }
  }, [folder, search, setup.database, isPage, toast]);

  const refresh = useCallback(() => {
    loadMessages();
    loadStats();
  }, [loadMessages, loadStats]);

  const runSync = useCallback(async () => {
    if (!setup.database || !setup.mailbox || syncing.current) return;
    syncing.current = true;
    setSync({ running: true, imported: 0, error: "" });
    let imported = 0;
    let automated = 0;
    try {
      // Each call imports a batch; keep going until the mailbox is caught up.
      for (let round = 0; round < 80; round++) {
        const result = await adminFetch<{
          imported: number;
          remaining: number;
          automated: number;
        }>("/api/admin/sync", { method: "POST" });
        imported += result.imported;
        automated += result.automated;
        setSync({ running: true, imported, error: "" });
        if (result.remaining === 0) break;
      }
      setSync({ running: false, imported, error: "" });
      // New automated mail is filed quietly; only people's emails are news.
      const people = Math.max(0, imported - automated);
      if (people > 0) {
        toast({
          tone: "ok",
          text: `${people} new ${people === 1 ? "email" : "emails"}.`,
        });
      } else if (automated > 0 && imported === 0) {
        toast({
          tone: "ok",
          text: `Filed ${automated} automated ${automated === 1 ? "email" : "emails"} away from your inbox.`,
        });
      }
    } catch (e) {
      setSync({
        running: false,
        imported,
        error: e instanceof Error ? e.message : "Sync failed.",
      });
    }
    syncing.current = false;
    refresh();
  }, [refresh, setup.database, setup.mailbox, toast]);

  useEffect(() => {
    // Sync once when the admin opens; later syncs are manual.
    const start = setTimeout(() => {
      loadStats();
      runSync();
    }, 0);
    return () => clearTimeout(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadMessages, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadMessages, search]);

  const openFolder = useCallback((next: View) => {
    setView(next);
    setSelected(null);
    setMessages(null);
    setSearch("");
  }, []);

  const openMessage = useCallback(
    (id: string) => {
      if (isPage) {
        setView("all");
        setMessages(null);
      }
      setSelected(id);
    },
    [isPage],
  );

  const index =
    messages && selected ? messages.findIndex((m) => m.id === selected) : -1;
  const prevId = index > 0 && messages ? messages[index - 1].id : null;
  const nextId =
    messages && index >= 0 && index < messages.length - 1
      ? messages[index + 1].id
      : null;

  useEffect(() => {
    // Each email opens at its top, not wherever the previous one was scrolled to.
    if (selected) window.scrollTo({ top: 0 });
  }, [selected]);

  const afterArchive = useCallback(() => {
    // Archiving removes the email from most folders, so move on to the next one.
    if (folder !== "archived") setSelected(nextId ?? prevId);
  }, [folder, nextId, prevId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!showShortcuts && document.querySelector('[role="dialog"]')) return;
      if (event.key === "Escape") {
        if (showShortcuts) setShowShortcuts(false);
        else if (isTyping(event.target)) (event.target as HTMLElement).blur();
        else setSelected(null);
        return;
      }
      if (showShortcuts || document.querySelector('[role="dialog"]') || isTyping(event.target)) return;
      if (event.key === "?") setShowShortcuts((v) => !v);
      else if (event.key === "/" && !isPage) {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "j" && messages?.length) {
        setSelected(nextId ?? (selected ? selected : messages[0].id));
      } else if (event.key === "k" && prevId) {
        setSelected(prevId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [messages, nextId, prevId, selected, showShortcuts, isPage]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.replace("/admin/login");
  }

  const groups = useMemo(() => {
    const out: { label: string; items: MessageSummary[] }[] = [];
    for (const m of messages ?? []) {
      const label = dateGroup(m.receivedAt);
      const last = out[out.length - 1];
      if (last?.label === label) last.items.push(m);
      else out.push({ label, items: [m] });
    }
    return out;
  }, [messages]);

  const folderMeta = FOLDERS.find((f) => f.key === folder)!;

  const syncLabel = sync.running
    ? `Syncing… ${sync.imported ? `${sync.imported} new` : ""}`
    : stats?.lastSyncedAt
      ? `Synced ${relativeTime(stats.lastSyncedAt)}`
      : "Not synced yet";

  return (
    <div className="relative flex min-h-svh">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(76,125,255,0.10),transparent)]"
      />

      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-white/[0.06] bg-canvas-raised/60 px-3 py-5 backdrop-blur lg:flex">
        <div className="flex items-center gap-2.5 px-3">
          <LogoMark className="size-8" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">{site.name}</p>
            <p className="text-[0.6875rem] text-white/50">Admin</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-0.5" aria-label="Admin">
          <NavItem
            icon={<LayoutDashboard className="size-4" />}
            label="Overview"
            active={view === "overview"}
            onClick={() => openFolder("overview")}
          />
          <p className="mt-5 mb-1.5 px-3 text-[0.625rem] font-semibold tracking-[0.12em] text-white/50 uppercase">
            Mail
          </p>
          {FOLDERS.map((f) => (
            <NavItem
              key={f.key}
              icon={<f.icon className="size-4" />}
              label={f.label}
              active={view === f.key}
              count={f.count && stats ? stats.counts[f.count] : undefined}
              strong={f.key === "all"}
              onClick={() => openFolder(f.key)}
            />
          ))}
          <p className="mt-5 mb-1.5 px-3 text-[0.625rem] font-semibold tracking-[0.12em] text-white/50 uppercase">
            AI
          </p>
          <NavItem
            icon={<SlidersHorizontal className="size-4" />}
            label="Project rules"
            active={view === "rules"}
            onClick={() => openFolder("rules")}
          />
          <NavItem
            icon={<Activity className="size-4" />}
            label="System"
            active={view === "system"}
            count={stats?.counts.errors}
            alert
            onClick={() => openFolder("system")}
          />
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 rounded-full",
                  sync.error
                    ? "bg-red-400"
                    : sync.running
                      ? "animate-pulse bg-brand-cyan"
                      : setup.mailbox
                        ? "bg-emerald-400"
                        : "bg-white/25",
                )}
              />
              <span className="min-w-0 flex-1 truncate text-xs text-white/60">
                {sync.error ? "Sync failed" : syncLabel}
              </span>
              <IconButton
                label="Sync mailbox"
                onClick={runSync}
                disabled={sync.running || !setup.mailbox || !setup.database}
                className="size-7"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn("size-3.5", sync.running && "animate-spin")}
                />
              </IconButton>
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <a
              href="/api/admin/export"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-white/50 hover:bg-white/[0.05] hover:text-white"
            >
              <Download aria-hidden="true" className="size-3.5" />
              Export CSV
            </a>
            <div className="flex">
              <IconButton
                label="Keyboard shortcuts (?)"
                onClick={() => setShowShortcuts(true)}
                className="size-8"
              >
                <Keyboard aria-hidden="true" className="size-4" />
              </IconButton>
              <IconButton label="Sign out" onClick={logout} className="size-8">
                <LogOut aria-hidden="true" className="size-4" />
              </IconButton>
            </div>
          </div>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-white/[0.06] bg-canvas/85 px-4 backdrop-blur lg:hidden">
          <LogoMark className="size-7" />
          <span className="text-sm font-semibold">Admin</span>
          <span className="ml-auto truncate text-xs text-white/50">
            {syncLabel}
          </span>
          <IconButton
            label="Sync mailbox"
            onClick={runSync}
            disabled={sync.running || !setup.mailbox || !setup.database}
          >
            <RefreshCw
              aria-hidden="true"
              className={cn("size-4", sync.running && "animate-spin")}
            />
          </IconButton>
          <IconButton label="Sign out" onClick={logout}>
            <LogOut aria-hidden="true" className="size-4" />
          </IconButton>
        </header>

        {missing.length || sync.error ? (
          <div className="flex flex-col gap-2 px-4 pt-4 sm:px-6 lg:px-8">
            {missing.length ? (
              <div className="flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3.5 text-sm">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-amber-300/80"
                />
                <p className="text-white/70">
                  Not connected yet:{" "}
                  {missing.map((key) => SETUP_LABELS[key]).join(", ")}. Add
                  these in Vercel → Settings → Environment Variables, then
                  redeploy.
                </p>
              </div>
            ) : null}
            {sync.error ? (
              <div
                role="alert"
                className="flex gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3.5 text-sm"
              >
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-red-300"
                />
                <p className="text-red-100/90">
                  Mailbox sync failed: {sync.error}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {view === "system" ? (
          <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <SystemPanel onErrorsChanged={loadStats} />
          </main>
        ) : view === "rules" ? (
          <main className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <RulesPanel />
          </main>
        ) : view === "overview" ? (
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Overview
              stats={stats}
              aiReady={setup.ai}
              onOpenMessage={openMessage}
              onOpenFolder={() => openFolder("awaiting")}
            />
          </main>
        ) : (
          <main className="flex min-h-0 flex-1">
            <section
              aria-label={folderMeta.label}
              className={cn(
                "flex w-full flex-col border-white/[0.06] lg:sticky lg:top-0 lg:h-svh lg:w-[22rem] lg:shrink-0 lg:border-r xl:w-[26rem]",
                selected && "hidden lg:flex",
              )}
            >
              <div className="border-b border-white/[0.06] px-4 pt-5 pb-3 sm:px-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h1 className="text-lg font-semibold tracking-[-0.02em] text-white">
                    {folderMeta.label}
                  </h1>
                  <span className="text-xs text-white/50 tabular-nums">
                    {messages
                      ? `${messages.length}${messages.length === 200 ? "+" : ""}`
                      : ""}
                  </span>
                </div>
                <label className="relative mt-3 block">
                  <span className="sr-only">Search emails</span>
                  <Search
                    aria-hidden="true"
                    className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/50"
                  />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search"
                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pr-14 pl-9 text-sm text-white placeholder:text-white/50 focus:border-brand-cyan/40 focus:ring-2 focus:ring-brand-cyan/15 focus:outline-none"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-white/50 hover:text-white"
                    >
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  ) : (
                    <span className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 sm:block">
                      <Kbd>/</Kbd>
                    </span>
                  )}
                </label>
                {/* Folder chips on mobile, where there is no sidebar. */}
                <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-0.5 lg:hidden">
                  {FOLDERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => openFolder(f.key)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-xs transition-colors",
                        view === f.key
                          ? "bg-white text-canvas"
                          : "border border-white/10 text-white/60",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {messages === null ? (
                  <ul>
                    {Array.from({ length: 7 }, (_, i) => (
                      <li
                        key={i}
                        className="flex gap-3 border-b border-white/[0.04] px-5 py-4"
                      >
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex flex-1 flex-col gap-2">
                          <Skeleton className="h-3.5 w-1/2" />
                          <Skeleton className="h-3 w-5/6" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={
                      search ? (
                        <MailSearch className="size-5" />
                      ) : (
                        <CheckCheck className="size-5" />
                      )
                    }
                    title={
                      search
                        ? "No matches"
                        : sync.running
                          ? "Importing your mailbox…"
                          : folder === "awaiting"
                            ? "All caught up"
                            : "Nothing here"
                    }
                    body={
                      search
                        ? `Nothing in ${folderMeta.label.toLowerCase()} matches “${search}”.`
                        : sync.running
                          ? "This can take a minute the first time."
                          : folder === "awaiting"
                            ? "Every email has a reply."
                            : "Emails will show up here."
                    }
                  />
                ) : (
                  groups.map((group) => (
                    <div key={group.label}>
                      <p className="sticky top-0 z-[1] bg-canvas/90 px-5 py-2 text-[0.6875rem] font-semibold tracking-wide text-white/50 uppercase backdrop-blur">
                        {group.label}
                      </p>
                      <ul>
                        {group.items.map((m) => (
                          <MessageRow
                            key={m.id}
                            message={m}
                            active={selected === m.id}
                            onOpen={() => setSelected(m.id)}
                          />
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section
              aria-label="Email"
              className={cn("min-w-0 flex-1", !selected && "hidden lg:block")}
            >
              {selected ? (
                <MessagePanel
                  key={selected}
                  id={selected}
                  aiReady={setup.ai}
                  emailReady={setup.email}
                  onBack={() => setSelected(null)}
                  onChanged={refresh}
                  onArchived={afterArchive}
                  onPrev={prevId ? () => setSelected(prevId) : undefined}
                  onNext={nextId ? () => setSelected(nextId) : undefined}
                />
              ) : (
                <EmptyState
                  icon={<Inbox className="size-5" />}
                  title="Select an email"
                  body={
                    <span className="flex items-center justify-center gap-1.5">
                      or press <Kbd>j</Kbd> to open the first one · <Kbd>?</Kbd>{" "}
                      for shortcuts
                    </span>
                  }
                  tall
                />
              )}
            </section>
          </main>
        )}
      </div>

      {/* Bottom tabs (mobile) */}
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/[0.08] bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {(
          [
            ["overview", "Overview", LayoutDashboard],
            ["all", "Inbox", Inbox],
            ["rules", "Project rules", SlidersHorizontal],
            ["system", "System", Activity],
          ] as const
        ).map(([key, label, Icon]) => {
          const count =
            key === "all"
              ? stats?.counts.unread
              : key === "system"
                ? stats?.counts.errors
                : 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => openFolder(key)}
              aria-current={view === key ? "page" : undefined}
              className={cn(
                "relative flex h-14 flex-col items-center justify-center gap-1 text-[0.625rem]",
                view === key ? "text-white" : "text-white/50",
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
              {count ? (
                <span className="absolute top-2 left-1/2 ml-2 min-w-4 rounded-full bg-brand-cyan px-1 text-[0.5625rem] leading-4 font-semibold text-canvas tabular-nums">
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <AnimatePresence>
        {showShortcuts ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              ref={shortcutsRef}
              role="dialog"
              aria-modal="true"
              aria-label="Keyboard shortcuts"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Keyboard shortcuts</h2>
                <IconButton
                  label="Close"
                  onClick={() => setShowShortcuts(false)}
                >
                  <X aria-hidden="true" className="size-4" />
                </IconButton>
              </div>
              <dl className="mt-4 flex flex-col gap-2.5">
                {SHORTCUTS.map(([keys, action]) => (
                  <div
                    key={action}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <dt className="text-white/65">{action}</dt>
                    <dd className="flex gap-1">
                      {keys.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  count,
  strong,
  alert,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  count?: number;
  strong?: boolean;
  /** Show the count as a problem to fix rather than a total. */
  alert?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
        active
          ? "bg-white/[0.08] text-white"
          : "text-white/55 hover:bg-white/[0.04] hover:text-white",
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-linear-to-b from-brand-cyan to-brand-violet"
        />
      ) : null}
      <span
        aria-hidden="true"
        className={cn(active ? "text-white" : "text-white/50")}
      >
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {count ? (
        <span
          className={cn(
            "rounded-md px-1.5 text-[0.6875rem] leading-5 tabular-nums",
            alert
              ? "bg-red-400/15 font-semibold text-red-200"
              : strong
                ? "bg-brand-cyan/15 font-semibold text-cyan-100"
                : "text-white/50",
          )}
          aria-label={alert ? `${count} unresolved` : undefined}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function MessageRow({
  message: m,
  active,
  onOpen,
}: {
  message: MessageSummary;
  active: boolean;
  onOpen: () => void;
}) {
  const unread = m.status === "new";
  const rowRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (active) rowRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <li ref={rowRef} className="relative">
      <button
        type="button"
        onClick={onOpen}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex w-full gap-3 border-b border-white/[0.04] px-4 py-3.5 text-left transition-colors sm:px-5",
          active ? "bg-white/[0.07]" : "hover:bg-white/[0.03]",
        )}
      >
        {active ? (
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-0 w-0.5 bg-linear-to-b from-brand-cyan to-brand-violet"
          />
        ) : null}
        <Avatar name={m.contactName} email={m.contactEmail} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                unread ? "font-semibold text-white" : "text-white/75",
              )}
            >
              {m.contactName || m.contactEmail}
            </span>
            {m.starred ? (
              <Star
                aria-label="Starred"
                className="size-3.5 shrink-0 fill-amber-300 text-amber-300"
              />
            ) : null}
            <span
              className={cn(
                "shrink-0 text-xs",
                unread ? "text-brand-cyan" : "text-white/50",
              )}
            >
              {relativeTime(m.receivedAt)}
            </span>
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate text-[0.8125rem]",
              unread ? "font-medium text-white/90" : "text-white/60",
            )}
          >
            {m.subject}
          </span>
          <span className="mt-0.5 line-clamp-1 text-xs text-white/50">
            {m.preview}
          </span>
          {m.source === "form" || m.status === "replied" || unread || m.fit ? (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {unread ? <Badge tone="new">New</Badge> : null}
              {m.source === "form" ? <Badge tone="form">Form</Badge> : null}
              {m.fit && m.status !== "replied" ? (
                <FitBadge decision={m.fit} compact />
              ) : null}
              {m.status === "replied" ? (
                <Badge tone="replied">Replied</Badge>
              ) : null}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

function EmptyState({
  icon,
  title,
  body,
  tall,
}: {
  icon: ReactNode;
  title: string;
  body: ReactNode;
  tall?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        tall && "h-full min-h-[60svh]",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white/50"
      >
        {icon}
      </span>
      <p className="text-sm font-medium text-white/80">{title}</p>
      <div className="text-xs text-white/50">{body}</div>
      {title === "Importing your mailbox…" ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-4 animate-spin text-white/50"
        />
      ) : null}
    </div>
  );
}
