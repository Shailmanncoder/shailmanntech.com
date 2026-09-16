"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, LoaderCircle, MailWarning } from "lucide-react";
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  buildMailtoFallback,
  budgetOptions,
  validateContact,
  type ContactPayload,
  type ContactResponse,
  type FieldErrors,
} from "@/lib/contact";
import { serviceOptions } from "@/lib/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/ui/ActionButton";
import { UnderlineLink } from "@/components/ui/UnderlineLink";
import { easeBrand } from "@/components/ui/Reveal";
import { useReducedMotion } from "@/lib/hooks";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "unconfigured"; message: string; mailto: string }
  | { kind: "error"; message: string };

const emptyForm: ContactPayload = {
  name: "",
  email: "",
  company: "",
  service: "",
  message: "",
  budget: "",
  website: "",
};

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[0.9375rem] text-white " +
  "placeholder:text-white/30 transition-[border-color,background-color,box-shadow] duration-300 " +
  "hover:border-white/18 focus:border-brand-cyan/50 focus:bg-white/[0.05] focus:outline-none " +
  "focus:ring-2 focus:ring-brand-cyan/20 disabled:opacity-60";

export function ContactForm() {
  const reduced = useReducedMotion();
  const formId = useId();
  const [values, setValues] = useState<ContactPayload>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const statusRef = useRef<HTMLDivElement>(null);

  const update =
    (field: keyof ContactPayload) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };

  const fieldId = (field: string) => `${formId}-${field}`;
  const errorId = (field: string) => `${formId}-${field}-error`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateContact(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = Object.keys(nextErrors)[0];
      document.getElementById(fieldId(first))?.focus();
      return;
    }

    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as ContactResponse;

      if (data.ok) {
        setStatus({ kind: "success" });
        setValues(emptyForm);
        return;
      }

      if (data.code === "invalid") {
        setErrors(data.errors);
        setStatus({ kind: "idle" });
        return;
      }

      if (data.code === "not_configured") {
        setStatus({
          kind: "unconfigured",
          message: data.message,
          mailto: buildMailtoFallback(site.email, values),
        });
        return;
      }

      setStatus({ kind: "error", message: data.message });
    } catch {
      setStatus({
        kind: "error",
        message: `Something went wrong on the way to our server. Please email ${site.email}.`,
      });
    }
  }

  const submitting = status.kind === "submitting";

  if (status.kind === "success") {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeBrand }}
        role="status"
        className="flex flex-col items-start gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:p-10"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-linear-to-br from-brand-cyan to-brand-violet">
          <Check aria-hidden="true" className="size-6 text-white" />
        </span>
        <div>
          <h3 className="text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">
            Request received.
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
            Thanks for reaching out — your project request is with us and
            we&rsquo;ll reply to the email address you gave.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="text-sm font-medium text-white/60 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white"
        >
          Send another request
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 sm:gap-6"
    >
      {/* honeypot — hidden from humans and assistive tech */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor={fieldId("website")}>Website</label>
        <input
          id={fieldId("website")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={update("website")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        <Field
          id={fieldId("name")}
          label="Name"
          error={errors.name}
          errorId={errorId("name")}
          required
        >
          <input
            id={fieldId("name")}
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={values.name}
            onChange={update("name")}
            disabled={submitting}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? errorId("name") : undefined}
            className={cn(
              fieldClass,
              "h-12",
              errors.name && "border-red-400/60",
            )}
          />
        </Field>

        <Field
          id={fieldId("email")}
          label="Email"
          error={errors.email}
          errorId={errorId("email")}
          required
        >
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            value={values.email}
            onChange={update("email")}
            disabled={submitting}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? errorId("email") : undefined}
            className={cn(
              fieldClass,
              "h-12",
              errors.email && "border-red-400/60",
            )}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
        <Field id={fieldId("company")} label="Company / Organization" optional>
          <input
            id={fieldId("company")}
            name="company"
            type="text"
            autoComplete="organization"
            placeholder="Optional"
            value={values.company}
            onChange={update("company")}
            disabled={submitting}
            className={cn(fieldClass, "h-12")}
          />
        </Field>

        <Field
          id={fieldId("service")}
          label="Service Needed"
          error={errors.service}
          errorId={errorId("service")}
          required
        >
          <div className="relative">
            <select
              id={fieldId("service")}
              name="service"
              value={values.service}
              onChange={update("service")}
              disabled={submitting}
              aria-invalid={Boolean(errors.service)}
              aria-describedby={errors.service ? errorId("service") : undefined}
              className={cn(
                fieldClass,
                "h-12 appearance-none pr-10",
                !values.service && "text-white/30",
                errors.service && "border-red-400/60",
              )}
            >
              <option value="" disabled>
                Select a service
              </option>
              {serviceOptions.map((option) => (
                <option key={option} value={option} className="bg-canvas">
                  {option}
                </option>
              ))}
            </select>
            <Chevron />
          </div>
        </Field>
      </div>

      <Field
        id={fieldId("message")}
        label="Project Description"
        error={errors.message}
        errorId={errorId("message")}
        required
      >
        <textarea
          id={fieldId("message")}
          name="message"
          rows={6}
          placeholder="What are you building, what stage is it at, and what would success look like?"
          value={values.message}
          onChange={update("message")}
          disabled={submitting}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? errorId("message") : undefined}
          className={cn(
            fieldClass,
            "resize-y py-3.5 leading-relaxed",
            errors.message && "border-red-400/60",
          )}
        />
      </Field>

      <Field id={fieldId("budget")} label="Budget Range" optional>
        <div className="relative">
          <select
            id={fieldId("budget")}
            name="budget"
            value={values.budget}
            onChange={update("budget")}
            disabled={submitting}
            className={cn(
              fieldClass,
              "h-12 appearance-none pr-10",
              !values.budget && "text-white/30",
            )}
          >
            <option value="">Optional</option>
            {budgetOptions.map((option) => (
              <option key={option} value={option} className="bg-canvas">
                {option}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </Field>

      <div ref={statusRef} aria-live="polite">
        <AnimatePresence mode="wait">
          {status.kind === "unconfigured" ? (
            <StatusBanner
              key="unconfigured"
              tone="warning"
              icon={<MailWarning aria-hidden="true" className="size-4" />}
              title="Not delivered — send it by email"
              reduced={reduced}
            >
              <p>{status.message}</p>
              <p className="mt-3">
                <UnderlineLink href={status.mailto} className="text-white">
                  Open a pre-filled email
                </UnderlineLink>
              </p>
            </StatusBanner>
          ) : status.kind === "error" ? (
            <StatusBanner
              key="error"
              tone="error"
              icon={<AlertCircle aria-hidden="true" className="size-4" />}
              title={"That didn’t go through"}
              reduced={reduced}
            >
              <p>{status.message}</p>
            </StatusBanner>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ActionButton
          type="submit"
          size="lg"
          arrow={submitting ? "none" : "right"}
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
              Sending…
            </span>
          ) : (
            "Send Project Request"
          )}
        </ActionButton>

        <p className="text-xs text-white/40">
          Prefer email?{" "}
          <UnderlineLink
            href={`mailto:${site.email}`}
            className="text-xs text-white/60"
          >
            {site.email}
          </UnderlineLink>
        </p>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  id,
  label,
  children,
  error,
  errorId,
  required,
  optional,
}: {
  id: string;
  label: string;
  children: ReactNode;
  error?: string;
  errorId?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-[0.8125rem] font-medium text-white/70"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="text-brand-cyan/70">
            *
          </span>
        ) : null}
        {optional ? (
          <span className="text-[0.6875rem] font-normal text-white/35">
            Optional
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-xs text-red-300/90">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-white/40"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function StatusBanner({
  tone,
  icon,
  title,
  children,
  reduced,
}: {
  tone: "warning" | "error";
  icon: ReactNode;
  title: string;
  children: ReactNode;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: easeBrand }}
      role="alert"
      className={cn(
        "flex gap-3 rounded-xl border p-4 text-sm leading-relaxed",
        tone === "warning"
          ? "border-amber-300/25 bg-amber-300/[0.06]"
          : "border-red-400/25 bg-red-400/[0.06]",
      )}
    >
      <span
        className={cn(
          "mt-0.5 shrink-0",
          tone === "warning" ? "text-amber-300/80" : "text-red-300/80",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-medium text-white/90">{title}</p>
        <div className="mt-1.5 text-white/60">{children}</div>
      </div>
    </motion.div>
  );
}
