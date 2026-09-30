"use client";

import {
  Archive,
  ArchiveRestore,
  Bot,
  UserRound,
  CheckCheck,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  CornerUpLeft,
  LoaderCircle,
  MailOpen,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";
import { ClientDetails } from "./WorkspacePanel";
import { Conversation } from "./Conversation";
import type { ReplyAttachment } from "@/lib/admin/workspace-validation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  adminFetch,
  formatDate,
  type FitDecision,
  type MessageDetail,
} from "./client";
import { FitBadge } from "./FitBadge";
import { Markdown } from "./Markdown";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  IconButton,
  Kbd,
  Skeleton,
  useToast,
} from "./ui";

const QUICK_TASKS = [
  "Thank them and suggest a short call this week",
  "Ask for their budget and timeline",
  "Say we can start next week",
  "Politely decline — we're fully booked",
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

export function MessagePanel({
  id,
  aiReady,
  emailReady,
  onBack,
  onChanged,
  onArchived,
  onPrev,
  onNext,
}: {
  id: string;
  aiReady: boolean;
  emailReady: boolean;
  onBack: () => void;
  onChanged: () => void;
  onArchived: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const toast = useToast();
  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showThread, setShowThread] = useState(true);
  const [fit, setFit] = useState<{
    decision: FitDecision;
    reason: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [files, setFiles] = useState<ReplyAttachment[]>([]);
  const [readingFiles, setReadingFiles] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // The parent keys this panel by id, so each email starts from fresh state.
    let cancelled = false;

    async function load() {
      try {
        const { message: m } = await adminFetch<{ message: MessageDetail }>(
          `/api/admin/messages/${id}`,
        );
        if (cancelled) return;
        setMessage(m);
        setAnalysis(m.aiAnalysis ?? "");
        onChanged();
        if (m.fit) setFit({ decision: m.fit, reason: m.fitReason ?? "" });
        if (m.smartDraft) setReply(m.smartDraft);

        // A person's email that hasn't been checked yet: check its fit against
        // the project rules and draft the reply straight away. The result is
        // saved, so this runs once per email.
        if (
          aiReady &&
          m.direction !== "outgoing" &&
          !m.automated &&
          m.status !== "replied" &&
          !m.fit
        ) {
          setChecking(true);
          try {
            const result = await adminFetch<{
              decision: FitDecision;
              reason: string;
              draft: string;
            }>(`/api/admin/messages/${id}/smart-reply`, { method: "POST" });
            if (cancelled) return;
            setFit({ decision: result.decision, reason: result.reason });
            setReply((current) => current || result.draft);
            onChanged();
          } catch (e) {
            if (!cancelled) {
              toast({
                tone: "error",
                text:
                  e instanceof Error ? e.message : "Couldn't check this email.",
              });
            }
          }
          if (!cancelled) setChecking(false);
        }
      } catch (e) {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : "Not found.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // onChanged only refreshes the list; reloading on its identity would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const patch = useCallback(
    async (
      changes: Partial<
        Pick<MessageDetail, "archived" | "starred" | "status" | "automated">
      >,
    ) => {
      setMessage((current) => (current ? { ...current, ...changes } : current));
      try {
        await adminFetch(`/api/admin/messages/${id}`, {
          method: "PATCH",
          body: changes,
        });
        onChanged();
      } catch (e) {
        toast({
          tone: "error",
          text: e instanceof Error ? e.message : "Update failed.",
        });
      }
    },
    [id, onChanged, toast],
  );

  const toggleArchive = useCallback(() => {
    if (!message) return;
    if (message.archived) {
      patch({ archived: false });
      toast({ tone: "ok", text: "Moved back to the inbox." });
      return;
    }
    patch({ archived: true });
    toast({
      tone: "ok",
      text: "Archived.",
      action: {
        label: "Undo",
        run: () => {
          adminFetch(`/api/admin/messages/${id}`, {
            method: "PATCH",
            body: { archived: false },
          }).then(onChanged);
        },
      },
    });
    onArchived();
  }, [id, message, onArchived, onChanged, patch, toast]);

  const toggleAutomated = useCallback(() => {
    if (!message) return;
    if (message.automated) {
      patch({ automated: false });
      toast({ tone: "ok", text: "Moved to your inbox as a person's email." });
      return;
    }
    patch({ automated: true });
    toast({
      tone: "ok",
      text: "Moved to Automated.",
      action: {
        label: "Undo",
        run: () => {
          adminFetch(`/api/admin/messages/${id}`, {
            method: "PATCH",
            body: { automated: false },
          }).then(onChanged);
        },
      },
    });
    onArchived();
  }, [id, message, onArchived, onChanged, patch, toast]);

  const toggleStar = useCallback(() => {
    if (message) patch({ starred: !message.starred });
  }, [message, patch]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        document.querySelector('[role="dialog"]') ||
        isTyping(event.target) ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      if (event.key === "s") toggleStar();
      else if (event.key === "e") toggleArchive();
      else if (event.key === "u") patch({ status: "new" });
      else if (event.key === "r") {
        event.preventDefault();
        replyRef.current?.focus();
        replyRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [patch, toggleArchive, toggleStar]);

  async function analyse() {
    setAnalysing(true);
    try {
      const data = await adminFetch<{ analysis: string }>(
        `/api/admin/messages/${id}/analyze`,
        { method: "POST" },
      );
      setAnalysis(data.analysis);
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Analysis failed.",
      });
    }
    setAnalysing(false);
  }

  async function regenerate() {
    setChecking(true);
    try {
      const result = await adminFetch<{
        decision: FitDecision;
        reason: string;
        draft: string;
      }>(`/api/admin/messages/${id}/smart-reply`, { method: "POST" });
      setFit({ decision: result.decision, reason: result.reason });
      setReply(result.draft);
      onChanged();
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't check this email.",
      });
    }
    setChecking(false);
  }

  async function draft(task: string) {
    setDrafting(true);
    try {
      const data = await adminFetch<{ draft: string }>(
        `/api/admin/messages/${id}/draft`,
        {
          method: "POST",
          body: { instruction: task },
        },
      );
      setReply(data.draft);
      requestAnimationFrame(() => replyRef.current?.focus());
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Drafting failed.",
      });
    }
    setDrafting(false);
  }

  async function pickFiles(list: FileList | null) {
    if (!list) return;
    const chosen = Array.from(list);
    if (
      chosen.length > 5 ||
      chosen.reduce((n, f) => n + f.size, 0) > 2 * 1024 * 1024
    ) {
      toast({ tone: "error", text: "Choose up to five files, 2 MB total." });
      return;
    }
    setReadingFiles(true);
    try {
      const attachments = await Promise.all(
        chosen.map(
          (file) =>
            new Promise<ReplyAttachment>((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = () =>
                reject(new Error("Couldn't read attachment."));
              reader.onload = () =>
                resolve({
                  filename: file.name,
                  content: String(reader.result).split(",")[1],
                });
              reader.readAsDataURL(file);
            }),
        ),
      );
      setFiles(attachments);
    } catch {
      toast({ tone: "error", text: "Couldn't read the selected files." });
    } finally {
      setReadingFiles(false);
    }
  }

  async function send() {
    if (!message || sending || readingFiles) return;
    setConfirming(false);
    setSending(true);
    try {
      const data = await adminFetch<{ message: MessageDetail }>(
        `/api/admin/messages/${id}/reply`,
        { method: "POST", body: { body: reply, attachments: files } },
      );
      setMessage(data.message);
      setReply("");
      setFiles([]);
      setInstruction("");
      toast({
        tone: "ok",
        text: `Reply sent to ${data.message.contactEmail}.`,
      });
      onChanged();
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Sending failed.",
      });
    }
    setSending(false);
  }

  // Grow the reply box with its content, up to a comfortable height.
  useEffect(() => {
    const el = replyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 176), 520)}px`;
  }, [reply]);

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm text-red-200">{loadError}</p>
        <Button onClick={onBack}>Back to inbox</Button>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex flex-col gap-5 p-5 sm:p-8">
        <Skeleton className="h-7 w-2/3" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="h-10 w-60" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  const who = message.contactName || message.contactEmail;
  const firstName = message.contactName.split(" ")[0] || who;

  return (
    <article className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-white/[0.06] bg-canvas/85 px-3 py-2 backdrop-blur sm:px-5">
        <IconButton label="Back to list" onClick={onBack} className="lg:hidden">
          <ArrowLeft aria-hidden="true" className="size-4" />
        </IconButton>
        <IconButton
          label="Previous email (k)"
          onClick={onPrev}
          disabled={!onPrev}
        >
          <ChevronUp aria-hidden="true" className="size-4" />
        </IconButton>
        <IconButton label="Next email (j)" onClick={onNext} disabled={!onNext}>
          <ChevronDown aria-hidden="true" className="size-4" />
        </IconButton>
        <div className="ml-auto flex items-center gap-1">
          <IconButton
            label={message.starred ? "Unstar (s)" : "Star (s)"}
            onClick={toggleStar}
            active={message.starred}
          >
            <Star
              aria-hidden="true"
              className={cn(
                "size-4",
                message.starred && "fill-amber-300 text-amber-300",
              )}
            />
          </IconButton>
          {message.status !== "replied" ? (
            <IconButton
              label="Mark as replied (answered elsewhere)"
              onClick={() => {
                patch({ status: "replied" });
                toast({ tone: "ok", text: "Marked as replied." });
              }}
            >
              <CheckCheck aria-hidden="true" className="size-4" />
            </IconButton>
          ) : null}
          <IconButton
            label={
              message.automated
                ? "Not automated — a person sent this"
                : "Mark as automated (not a person)"
            }
            onClick={toggleAutomated}
          >
            {message.automated ? (
              <UserRound aria-hidden="true" className="size-4" />
            ) : (
              <Bot aria-hidden="true" className="size-4" />
            )}
          </IconButton>
          <IconButton
            label="Mark unread (u)"
            onClick={() => patch({ status: "new" })}
          >
            <MailOpen aria-hidden="true" className="size-4" />
          </IconButton>
          <IconButton
            label={message.archived ? "Move to inbox (e)" : "Archive (e)"}
            onClick={toggleArchive}
          >
            {message.archived ? (
              <ArchiveRestore aria-hidden="true" className="size-4" />
            ) : (
              <Archive aria-hidden="true" className="size-4" />
            )}
          </IconButton>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
        <header>
          <div className="flex flex-wrap items-center gap-1.5">
            {message.source === "form" ? (
              <Badge tone="form">Website form</Badge>
            ) : null}
            {message.status === "replied" ? (
              <Badge tone="replied">
                <Check aria-hidden="true" className="size-3" />{" "}
                {message.direction === "outgoing" ? "Sent" : "Replied"}
              </Badge>
            ) : null}
            {message.archived ? <Badge tone="neutral">Archived</Badge> : null}
            {message.automated ? (
              <Badge tone="neutral">
                <Bot aria-hidden="true" className="size-3" /> Automated
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-balance text-white sm:text-2xl">
            {message.subject}
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <Avatar
              name={message.contactName}
              email={message.contactEmail}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{who}</p>
              <p className="flex items-center gap-1.5 text-xs text-white/50">
                <span className="truncate">{message.contactEmail}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(message.contactEmail);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="shrink-0 rounded p-0.5 text-white/50 hover:text-white"
                  aria-label="Copy email address"
                  title="Copy email address"
                >
                  {copied ? (
                    <Check aria-hidden="true" className="size-3" />
                  ) : (
                    <Copy aria-hidden="true" className="size-3" />
                  )}
                </button>
              </p>
            </div>
            <time
              dateTime={message.receivedAt}
              className="shrink-0 text-right text-xs text-white/50"
            >
              {formatDate(message.receivedAt, true)}
            </time>
          </div>
        </header>

        {message.automated ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm">
            <Bot aria-hidden="true" className="size-4 shrink-0 text-white/50" />
            <p className="min-w-0 flex-1 text-white/65">
              Filed as automated
              {message.automatedReason ? (
                <span className="text-white/50">
                  {" "}
                  · {message.automatedReason}
                </span>
              ) : null}
              . It&rsquo;s left out of your inbox, stats and AI.
            </p>
            <Button size="sm" onClick={toggleAutomated}>
              <UserRound aria-hidden="true" className="size-3.5" />A person sent
              this
            </Button>
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-5 text-[0.9375rem] leading-relaxed break-words whitespace-pre-wrap text-white/85 sm:px-6">
          {message.body.trim() || (
            <span className="text-white/50">
              (This email has no text content.)
            </span>
          )}
        </div>

        <div className="space-y-4">
          <ClientDetails
            email={message.contactEmail}
            name={message.contactName}
            onTemplate={(body) =>
              setReply((current) => (current ? current + "\n\n" + body : body))
            }
          />
          <Conversation id={id} />
          {message.attachments?.length ? (
            <Card className="p-4">
              <h2 className="font-semibold">Attachments</h2>
              <ul className="mt-2 space-y-2">
                {message.attachments.map((a) => (
                  <li key={a.index}>
                    <a
                      className="text-sm text-cyan-200 underline"
                      href={`/api/admin/messages/${id}/attachments/${a.index}`}
                    >
                      {a.filename} ({Math.ceil(a.size / 1024)} KB)
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-white/60">
                Files download from the original mailbox. Open only files you
                trust.
              </p>
            </Card>
          ) : null}
        </div>
        {message.replies.length ? (
          <div>
            <button
              type="button"
              onClick={() => setShowThread((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white"
            >
              <CornerUpLeft aria-hidden="true" className="size-3.5" />
              {message.replies.length}{" "}
              {message.replies.length === 1 ? "reply" : "replies"} sent
              {showThread ? (
                <ChevronUp aria-hidden="true" className="size-3.5" />
              ) : (
                <ChevronDown aria-hidden="true" className="size-3.5" />
              )}
            </button>
            {showThread ? (
              <ol className="mt-3 flex flex-col gap-3 border-l border-emerald-400/20 pl-4">
                {message.replies.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4"
                  >
                    <p className="text-xs text-emerald-200/80">
                      You · {formatDate(r.sentAt, true)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-white/80">
                      {r.body}
                    </p>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}

        <Card className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-cyan/40 to-transparent"
          />
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <h2 className="flex items-center gap-2.5 text-sm font-semibold">
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-brand-cyan/25 to-brand-violet/25 text-cyan-100"
              >
                <Sparkles className="size-4" />
              </span>
              AI summary
            </h2>
            {aiReady && (analysis || analysing) ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={analyse}
                disabled={analysing}
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn("size-3.5", analysing && "animate-spin")}
                />
                Refresh
              </Button>
            ) : null}
          </div>
          <div className="border-t border-white/[0.06] px-5 py-4">
            {!aiReady ? (
              <p className="text-sm text-white/50">
                Add OPENAI_API_KEY to use AI.
              </p>
            ) : analysing ? (
              <div className="flex flex-col gap-2.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : analysis ? (
              <Markdown text={analysis} />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-white/50">
                  Get a summary, priority and what to cover in your reply.
                </p>
                <Button size="sm" variant="ai" onClick={analyse}>
                  <Sparkles aria-hidden="true" className="size-3.5" />
                  Analyse email
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CornerUpLeft
                aria-hidden="true"
                className="size-4 text-white/60"
              />
              Reply
            </h2>
            <p className="min-w-0 truncate text-xs text-white/50">
              To <span className="text-white/75">{message.contactEmail}</span>
            </p>
          </div>

          {aiReady && !message.automated ? (
            <div className="border-t border-white/[0.06] px-5 py-4">
              {checking ? (
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 shrink-0 animate-spin text-cyan-200"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white/80">
                      Checking this against your project rules…
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">
                      The reply will be drafted for you to review.
                    </p>
                  </div>
                </div>
              ) : fit ? (
                <div className="flex flex-wrap items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                  <FitBadge decision={fit.decision} />
                  <p className="min-w-0 flex-1 basis-48 text-sm text-white/65">
                    {fit.reason}
                  </p>
                  <Button size="sm" variant="ghost" onClick={regenerate}>
                    <RefreshCw aria-hidden="true" className="size-3.5" />
                    Redo
                  </Button>
                </div>
              ) : message.status !== "replied" ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                  <p className="text-sm text-white/55">
                    Check this against your project rules and draft the reply.
                  </p>
                  <Button size="sm" variant="ai" onClick={regenerate}>
                    <Sparkles aria-hidden="true" className="size-3.5" />
                    Smart reply
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {aiReady ? (
            <div className="border-t border-white/[0.06] px-5 py-4">
              <p className="mb-2 text-xs text-white/50">
                Or tell AI exactly what to say:
              </p>
              <form
                className="flex items-center gap-2 rounded-xl border border-brand-cyan/20 bg-brand-cyan/[0.04] p-1.5 pl-3 focus-within:border-brand-cyan/40"
                onSubmit={(e) => {
                  e.preventDefault();
                  draft(instruction);
                }}
              >
                <Wand2
                  aria-hidden="true"
                  className="size-4 shrink-0 text-cyan-200/70"
                />
                <input
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder={`Tell AI what to say to ${firstName}…`}
                  aria-label="Instruction for the AI draft"
                  className="h-8 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="ai"
                  disabled={drafting}
                >
                  {drafting ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-3.5 animate-spin"
                    />
                  ) : null}
                  {reply ? "Rewrite" : "Write"}
                </Button>
              </form>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {QUICK_TASKS.map((task) => (
                  <button
                    key={task}
                    type="button"
                    disabled={drafting}
                    onClick={() => {
                      setInstruction(task);
                      draft(task);
                    }}
                    className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[0.6875rem] text-white/55 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40"
                  >
                    {task}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2 border-t border-white/10 p-4">
            <label className="block text-sm">
              Attach files (up to 5, 2 MB total)
              <input
                type="file"
                multiple
                disabled={sending || readingFiles}
                onChange={(e) => pickFiles(e.target.files)}
                className="mt-2 block w-full text-sm"
              />
            </label>
            {files.length ? (
              <div className="text-sm text-white/70">
                {files.map((f) => f.filename).join(", ")}{" "}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setFiles([])}
                >
                  Remove attachments
                </Button>
              </div>
            ) : null}
          </div>
          <div className="relative border-t border-white/[0.06]">
            <textarea
              ref={replyRef}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  (e.metaKey || e.ctrlKey) &&
                  reply.trim()
                ) {
                  e.preventDefault();
                  setConfirming(true);
                }
              }}
              placeholder={`Write to ${firstName}, or let AI draft it and edit…`}
              aria-label="Reply"
              disabled={drafting || checking}
              className="block min-h-44 w-full resize-none bg-transparent px-5 py-4 text-[0.9375rem] leading-relaxed text-white placeholder:text-white/50 focus:outline-none disabled:opacity-50"
            />
            {drafting ? (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-canvas/40 text-sm text-cyan-100 backdrop-blur-[1px]">
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
                Writing a draft…
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3">
            <p className="hidden items-center gap-1.5 text-xs text-white/50 sm:flex">
              <Kbd>⌘</Kbd>
              <Kbd>Enter</Kbd>
              to send · original email quoted below
            </p>
            <div className="ml-auto flex items-center gap-2">
              {reply ? (
                <Button size="sm" variant="ghost" onClick={() => setReply("")}>
                  Discard
                </Button>
              ) : null}
              <Button
                variant="primary"
                onClick={() => setConfirming(true)}
                disabled={
                  !emailReady || sending || readingFiles || !reply.trim()
                }
              >
                {sending ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <Send aria-hidden="true" className="size-4" />
                )}
                Send reply
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Send this reply to ${who}?`}
        body={
          <>
            It goes to{" "}
            <span className="text-white/85">{message.contactEmail}</span> from
            your support address, with their original email quoted below.
            {files.length > 0 && (
              <span className="mt-2 block">
                Attachments: {files.map((f) => f.filename).join(", ")}
              </span>
            )}
          </>
        }
        confirmLabel="Send reply"
        onConfirm={send}
        onCancel={() => setConfirming(false)}
      />
    </article>
  );
}
