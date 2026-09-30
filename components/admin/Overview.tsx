"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  Inbox,
  LoaderCircle,
  MailCheck,
  SendHorizontal,
  Sparkles,
  Timer,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { adminFetch, waitingFor, type InboxStats } from "./client";
import { Markdown } from "./Markdown";
import { MonthlyChart } from "./MonthlyChart";
import { Avatar, Badge, Card, Skeleton } from "./ui";

const SUGGESTIONS = [
  "Which emails need a reply most urgently?",
  "Summarise this month's project requests",
  "Which services are people asking about most?",
  "Are there any spam or suspicious emails?",
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Overview({
  stats,
  aiReady,
  onOpenMessage,
  onOpenFolder,
}: {
  stats: InboxStats | null;
  aiReady: boolean;
  onOpenMessage: (id: string) => void;
  onOpenFolder: () => void;
}) {
  const [hello, setHello] = useState({ greeting: "", date: "" });
  useEffect(() => {
    // Greeting and date use the viewer's clock and locale, so they are
    // computed in the browser rather than during server rendering.
    const timer = setTimeout(
      () =>
        setHello({
          greeting: greeting(),
          date: new Date().toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
          }),
        }),
      0,
    );
    return () => clearTimeout(timer);
  }, []);

  const change =
    stats && stats.lastMonth > 0
      ? Math.round(
          ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100,
        )
      : null;
  const replyRate =
    stats && stats.total > 0
      ? Math.round((stats.replied / stats.total) * 100)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="h-5 text-sm text-white/50">{hello.date}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
          {hello.greeting
            ? `${hello.greeting}, ${site.shortName}`
            : site.shortName}
        </h1>
        <p className="mt-1.5 text-sm text-white/55">
          {stats
            ? stats.awaiting > 0
              ? `${stats.awaiting} ${stats.awaiting === 1 ? "email is" : "emails are"} waiting for a reply.`
              : "You're all caught up. Nice work."
            : "Loading your inbox…"}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={<Inbox className="size-4" />}
          label="This month"
          value={stats?.thisMonth}
          trend={
            change === null
              ? undefined
              : { value: change, label: "vs last month" }
          }
          note={
            change === null && stats
              ? `${stats.lastMonth} last month`
              : undefined
          }
        />
        <StatCard
          icon={<Clock className="size-4" />}
          label="Awaiting reply"
          value={stats?.awaiting}
          note="Not replied or archived"
          highlight={Boolean(stats && stats.awaiting > 0)}
        />
        <StatCard
          icon={<MailCheck className="size-4" />}
          label="Replied"
          value={stats?.replied}
          note={
            replyRate === null || !stats
              ? undefined
              : `${replyRate}% of ${stats.total} emails`
          }
        />
        <StatCard
          icon={<Timer className="size-4" />}
          label="Typical reply time"
          value={
            stats
              ? stats.medianReplyHours == null
                ? "—"
                : formatHours(stats.medianReplyHours)
              : undefined
          }
          note="Median time to first reply"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">
              Emails per month
            </h2>
            <span className="text-xs text-white/50">Last 12 months</span>
          </div>
          <div className="mt-4">
            {stats ? (
              <MonthlyChart data={stats.monthly} />
            ) : (
              <Skeleton className="h-64" />
            )}
          </div>
        </Card>

        <Card className="flex flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">
              Needs your reply
            </h2>
            <button
              type="button"
              onClick={onOpenFolder}
              className="flex items-center gap-1 text-xs text-white/50 hover:text-white"
            >
              View all <ArrowRight aria-hidden="true" className="size-3" />
            </button>
          </div>
          <p className="mt-1 text-xs text-white/50">
            Last 30 days, longest waiting first
          </p>
          <ul className="mt-4 flex flex-1 flex-col gap-1">
            {!stats ? (
              Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-8 flex-1" />
                </li>
              ))
            ) : stats.needsReply.length === 0 ? (
              <li className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                  <Check aria-hidden="true" className="size-5" />
                </span>
                <span className="text-sm text-white/60">
                  Nothing waiting. Inbox zero!
                </span>
              </li>
            ) : (
              stats.needsReply.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onOpenMessage(m.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <Avatar
                      name={m.contactName}
                      email={m.contactEmail}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-white/90">
                          {m.contactName || m.contactEmail}
                        </span>
                        {m.source === "form" ? (
                          <Badge tone="form">Form</Badge>
                        ) : null}
                      </span>
                      <span className="block truncate text-xs text-white/50">
                        {m.subject}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[0.6875rem] text-amber-200/80">
                      <Clock aria-hidden="true" className="size-3" />
                      {waitingFor(m.receivedAt)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white">
            Top services requested
          </h2>
          <p className="mt-1 text-xs text-white/50">
            Website form requests, last 12 months
          </p>
          <TopServices stats={stats} />
        </Card>

        <Assistant ready={aiReady} />
      </div>
    </div>
  );
}

function formatHours(hours: number) {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} days`;
}

function StatCard({
  icon,
  label,
  value,
  note,
  trend,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: number | string | undefined;
  note?: string;
  trend?: { value: number; label: string };
  highlight?: boolean;
}) {
  const up = trend && trend.value >= 0;
  return (
    <Card
      className={cn(
        "relative overflow-hidden p-4 sm:p-5",
        highlight && "border-brand-cyan/20",
      )}
    >
      {highlight ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-brand-cyan/15 blur-2xl"
        />
      ) : null}
      <div className="flex items-center gap-2 text-xs text-white/50">
        <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center rounded-lg bg-white/[0.06] text-white/70"
        >
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white tabular-nums">
        {value ?? <Skeleton className="h-9 w-14" />}
      </div>
      {trend ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
              up
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-red-400/10 text-red-300",
            )}
          >
            {up ? (
              <ArrowUpRight aria-hidden="true" className="size-3" />
            ) : (
              <ArrowDownRight aria-hidden="true" className="size-3" />
            )}
            {up ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-white/50">{trend.label}</span>
        </p>
      ) : note ? (
        <p className="mt-1.5 text-xs text-white/50">{note}</p>
      ) : null}
    </Card>
  );
}

function TopServices({ stats }: { stats: InboxStats | null }) {
  if (!stats) {
    return (
      <div className="mt-5 flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-7" />
        ))}
      </div>
    );
  }
  if (stats.topServices.length === 0) {
    return <p className="mt-6 text-sm text-white/50">No form requests yet.</p>;
  }
  const max = Math.max(...stats.topServices.map((s) => s.count));
  return (
    <ul className="mt-5 flex flex-col gap-3.5">
      {stats.topServices.map((item) => (
        <li key={item.service}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-white/80">{item.service}</span>
            <span className="shrink-0 text-xs text-white/50 tabular-nums">
              {item.count}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-[#0ea5c6]"
              style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

type Turn = { question: string; answer?: string; error?: string };

function Assistant({ ready }: { ready: boolean }) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (turns.length)
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    setQuestion("");
    setTurns((list) => [...list, { question: q }]);
    let update: Partial<Turn>;
    try {
      const data = await adminFetch<{ answer: string }>("/api/admin/ask", {
        method: "POST",
        body: { question: q },
      });
      update = { answer: data.answer };
    } catch (e) {
      update = {
        error: e instanceof Error ? e.message : "Something went wrong.",
      };
    }
    setTurns((list) =>
      list.map((t, i) => (i === list.length - 1 ? { ...t, ...update } : t)),
    );
    setBusy(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(question);
  }

  return (
    <Card className="relative flex min-h-96 flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-cyan/50 to-transparent"
      />
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <h2 className="flex items-center gap-2.5 text-sm font-semibold text-white">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-brand-cyan/25 to-brand-violet/25 text-cyan-100"
          >
            <Sparkles className="size-4" />
          </span>
          Ask AI about your inbox
        </h2>
        {turns.length ? (
          <button
            type="button"
            onClick={() => setTurns([])}
            disabled={busy}
            className="text-xs text-white/50 hover:text-white disabled:opacity-40"
          >
            New chat
          </button>
        ) : null}
      </div>

      {!ready ? (
        <p className="p-6 text-sm text-white/50">
          Add OPENAI_API_KEY in Vercel to turn on the AI assistant.
        </p>
      ) : (
        <>
          <div className="flex max-h-[34rem] flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 sm:px-6">
            {turns.length === 0 ? (
              <div className="my-auto">
                <p className="text-sm text-white/55">
                  Ask anything about your emails. The AI reads your recent inbox
                  and your stats.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => ask(suggestion)}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3 text-left text-sm text-white/70 transition-colors hover:border-brand-cyan/30 hover:bg-brand-cyan/[0.05] hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              turns.map((turn, index) => (
                <div key={index} className="flex flex-col gap-3">
                  <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white/[0.08] px-4 py-2.5 text-sm text-white">
                    {turn.question}
                  </p>
                  {turn.answer ? (
                    <div className="group relative rounded-2xl rounded-bl-md border border-white/[0.08] bg-canvas/60 p-4 pr-10 sm:p-5 sm:pr-12">
                      <Markdown text={turn.answer} />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(turn.answer ?? "");
                          setCopied(index);
                          setTimeout(() => setCopied(null), 1500);
                        }}
                        className="absolute top-3 right-3 rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                        aria-label="Copy answer"
                        title="Copy answer"
                      >
                        {copied === index ? (
                          <Check aria-hidden="true" className="size-3.5" />
                        ) : (
                          <Copy aria-hidden="true" className="size-3.5" />
                        )}
                      </button>
                    </div>
                  ) : turn.error ? (
                    <p
                      role="alert"
                      className="rounded-xl bg-red-400/10 px-4 py-3 text-sm text-red-200"
                    >
                      {turn.error}
                    </p>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-white/50">
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                      Reading your inbox…
                    </p>
                  )}
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={submit}
            className="border-t border-white/[0.06] p-3 sm:p-4"
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 pl-4 focus-within:border-brand-cyan/40 focus-within:ring-2 focus-within:ring-brand-cyan/15">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Which requests mention a budget over $15,000?"
                aria-label="Ask a question about your inbox"
                className="h-9 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !question.trim()}
                aria-label="Ask"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-brand-blue to-brand-violet text-white transition hover:brightness-110 disabled:opacity-40"
              >
                {busy ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <SendHorizontal aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </Card>
  );
}
