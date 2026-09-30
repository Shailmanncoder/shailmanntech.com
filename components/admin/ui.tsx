"use client";

import { useModalFocus } from "./useModalFocus";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */

const AVATAR_TONES = [
  "from-sky-500/80 to-blue-600/80",
  "from-violet-500/80 to-indigo-600/80",
  "from-cyan-500/80 to-teal-600/80",
  "from-fuchsia-500/80 to-purple-600/80",
  "from-emerald-500/80 to-cyan-600/80",
  "from-indigo-500/80 to-sky-600/80",
];

function initials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0];
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters =
    parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : source.slice(0, 2);
  return letters.toUpperCase();
}

export function Avatar({
  name,
  email,
  size = "md",
}: {
  name: string;
  email: string;
  size?: "sm" | "md" | "lg";
}) {
  const key = (email || name).toLowerCase();
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-semibold text-white ring-1 ring-white/15",
        AVATAR_TONES[hash % AVATAR_TONES.length],
        size === "sm" && "size-8 text-[0.6875rem]",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-12 text-sm",
      )}
    >
      {initials(name, email)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Buttons, badges, cards                                             */
/* ------------------------------------------------------------------ */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>;
  variant?: "primary" | "secondary" | "ghost" | "ai";
  size?: "sm" | "md";
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40 disabled:pointer-events-none disabled:opacity-45",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variant === "primary" &&
          "bg-linear-to-r from-brand-blue to-brand-violet text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] hover:brightness-110",
        variant === "secondary" &&
          "border border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
        variant === "ghost" &&
          "text-white/60 hover:bg-white/[0.06] hover:text-white",
        variant === "ai" &&
          "border border-brand-cyan/25 bg-brand-cyan/10 text-cyan-100 hover:border-brand-cyan/40 hover:bg-brand-cyan/15",
        className,
      )}
    />
  );
}

export function IconButton({
  label,
  className,
  active,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40 disabled:opacity-40",
        active && "text-white",
        className,
      )}
    />
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "form" | "replied" | "new" | "neutral";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide uppercase",
        tone === "form" && "bg-[#0ea5c6]/15 text-cyan-200",
        tone === "replied" && "bg-emerald-400/10 text-emerald-200",
        tone === "new" && "bg-brand-violet/20 text-violet-200",
        tone === "neutral" && "bg-white/[0.06] text-white/55",
      )}
    >
      {children}
    </span>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-linear-to-b from-white/[0.035] to-white/[0.015] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-white/[0.05]", className)}
    />
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/15 bg-white/[0.06] px-1 font-mono text-[0.625rem] text-white/70">
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------------ */
/*  Toasts                                                             */
/* ------------------------------------------------------------------ */

type Toast = {
  id: number;
  tone: "ok" | "error";
  text: string;
  action?: { label: string; run: () => void };
};

const ToastContext = createContext<(toast: Omit<Toast, "id">) => void>(
  () => {},
);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { ...toast, id }]);
      setTimeout(() => dismiss(id), toast.action ? 6000 : 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              role={toast.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-white/10 bg-surface/95 py-2.5 pr-2 pl-3.5 text-sm text-white shadow-2xl backdrop-blur"
            >
              {toast.tone === "ok" ? (
                <CheckCircle2
                  aria-hidden="true"
                  className="size-4 shrink-0 text-emerald-300"
                />
              ) : (
                <AlertCircle
                  aria-hidden="true"
                  className="size-4 shrink-0 text-red-300"
                />
              )}
              <span className="min-w-0 flex-1">{toast.text}</span>
              {toast.action ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.run();
                    dismiss(toast.id);
                  }}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-brand-cyan hover:bg-white/5"
                >
                  {toast.action.label}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="rounded-md p-1 text-white/50 hover:text-white"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Confirm dialog                                                     */
/* ------------------------------------------------------------------ */

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl"
          >
            <h2
              id="confirm-title"
              className="text-base font-semibold text-white"
            >
              {title}
            </h2>
            <div className="mt-2 text-sm leading-relaxed text-white/60">
              {body}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={onCancel}>Cancel</Button>
              <Button ref={confirmRef} variant="primary" onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
