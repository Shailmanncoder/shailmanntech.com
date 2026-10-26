"use client";

import { Ban, LoaderCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { SHARED_DOMAINS } from "@/lib/blocklist";
import { cn } from "@/lib/utils";
import { adminFetch } from "./client";
import { Button, Skeleton, useToast } from "./ui";
import { useModalFocus } from "./useModalFocus";

export type BlockedSender = {
  id: string;
  pattern: string;
  note: string;
  createdAt: string;
  messages: number;
};

type Saved = { pattern: string; messages: number; blocked: BlockedSender[] };

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useModalFocus(open, ref);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85svh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2
                id="block-title"
                className="flex items-center gap-2 text-base font-semibold text-white"
              >
                <Ban aria-hidden="true" className="size-4 text-red-300" />
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded p-1 text-white/50 hover:text-white"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

const WHAT_HAPPENS = [
  "Their emails go to Blocked, not your inbox — no alerts or AI.",
  "The contact form quietly ignores them.",
  "They can't sign up or log in to the client portal.",
];

/** Blocks the sender of an email: their address, or their whole company domain. */
export function BlockDialog({
  open,
  email,
  name,
  onClose,
  onBlocked,
}: {
  open: boolean;
  email: string;
  name: string;
  onClose: () => void;
  onBlocked: () => void;
}) {
  const toast = useToast();
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const domainAllowed = Boolean(domain) && !SHARED_DOMAINS.has(domain);
  const [scope, setScope] = useState<"address" | "domain">("address");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function block() {
    setBusy(true);
    try {
      const data = await adminFetch<Saved>("/api/admin/blocked", {
        method: "POST",
        body: { pattern: scope === "domain" ? domain : email, note },
      });
      toast({
        tone: "ok",
        text: `Blocked ${data.pattern}. ${data.messages} ${data.messages === 1 ? "email" : "emails"} moved to Blocked.`,
      });
      onBlocked();
      onClose();
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't block.",
      });
    }
    setBusy(false);
  }

  return (
    <Modal open={open} title={`Block ${name || email}?`} onClose={onClose}>
      <fieldset className="mt-4 space-y-2">
        <legend className="sr-only">What to block</legend>
        <Choice
          checked={scope === "address"}
          onChange={() => setScope("address")}
          label={`Only ${email}`}
        />
        {domainAllowed ? (
          <Choice
            checked={scope === "domain"}
            onChange={() => setScope("domain")}
            label={`Everyone at ${domain}`}
            hint="Also stops new addresses they make on this domain."
          />
        ) : domain ? (
          <p className="px-1 text-xs text-white/50">
            {domain} is a public mail provider, so only this address can be
            blocked.
          </p>
        ) : null}
      </fieldset>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-white/65">
        {WHAT_HAPPENS.map((line) => (
          <li key={line}>{line}</li>
        ))}
        <li>They aren&rsquo;t told. You can unblock any time.</li>
      </ul>
      <label className="mt-4 block text-xs text-white/70">
        Note for yourself (optional)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          placeholder="e.g. abusive messages"
          className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/40 focus:border-brand-cyan/50 focus:outline-none"
        />
      </label>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <button
          type="button"
          onClick={block}
          disabled={busy}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-medium text-white transition-colors hover:bg-red-400 focus-visible:ring-2 focus-visible:ring-red-300/50 focus-visible:outline-none disabled:opacity-45"
        >
          {busy ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Ban aria-hidden="true" className="size-4" />
          )}
          Block
        </button>
      </div>
    </Modal>
  );
}

function Choice({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-xl border px-3.5 py-3 text-sm",
        checked
          ? "border-red-400/40 bg-red-400/[0.06] text-white"
          : "border-white/10 text-white/75 hover:border-white/20",
      )}
    >
      <input
        type="radio"
        name="block-scope"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 accent-red-400"
      />
      <span className="min-w-0 break-all">
        {label}
        {hint ? (
          <span className="mt-0.5 block text-xs break-normal text-white/50">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/** The full blocklist: add an address or domain, or unblock one. */
export function BlockedListDialog({
  open,
  onClose,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [list, setList] = useState<BlockedSender[] | null>(null);
  const [pattern, setPattern] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    adminFetch<{ blocked: BlockedSender[] }>("/api/admin/blocked")
      .then((data) => active && setList(data.blocked))
      .catch((e: Error) => toast({ tone: "error", text: e.message }));
    return () => {
      active = false;
    };
  }, [open, toast]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pattern.trim()) return;
    setBusy("add");
    try {
      const data = await adminFetch<Saved>("/api/admin/blocked", {
        method: "POST",
        body: { pattern },
      });
      setList(data.blocked);
      setPattern("");
      onChanged();
      toast({ tone: "ok", text: `Blocked ${data.pattern}.` });
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't block.",
      });
    }
    setBusy(null);
  }

  async function unblock(entry: BlockedSender) {
    setBusy(entry.id);
    try {
      const data = await adminFetch<Saved>("/api/admin/blocked", {
        method: "DELETE",
        body: { id: entry.id },
      });
      setList(data.blocked);
      onChanged();
      toast({
        tone: "ok",
        text: `Unblocked ${entry.pattern}.${data.messages ? ` ${data.messages} ${data.messages === 1 ? "email" : "emails"} back in your inbox.` : ""}`,
      });
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't unblock.",
      });
    }
    setBusy(null);
  }

  return (
    <Modal open={open} title="Blocked senders" onClose={onClose}>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Address or domain to block</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="name@example.com or example.com"
            className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/40 focus:border-brand-cyan/50 focus:outline-none"
          />
        </label>
        <Button type="submit" disabled={busy !== null || !pattern.trim()}>
          {busy === "add" ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Ban aria-hidden="true" className="size-4" />
          )}
          Block
        </Button>
      </form>
      <div className="mt-5">
        {list === null ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : list.length === 0 ? (
          <p className="rounded-xl border border-white/[0.08] px-4 py-6 text-center text-sm text-white/55">
            No one is blocked.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08]">
            {list.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">
                    {entry.pattern.includes("@")
                      ? entry.pattern
                      : `Everyone at ${entry.pattern}`}
                  </p>
                  <p className="truncate text-xs text-white/50">
                    {entry.messages} {entry.messages === 1 ? "email" : "emails"}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => unblock(entry)}
                  disabled={busy !== null}
                >
                  {busy === entry.id ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-3.5 animate-spin"
                    />
                  ) : null}
                  Unblock
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
