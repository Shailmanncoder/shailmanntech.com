"use client";

import { ArrowLeft, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { budgetOptions } from "@/lib/contact";

const field =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[0.9375rem] text-white " +
  "placeholder:text-white/40 focus:border-brand-cyan/50 focus:ring-2 focus:ring-brand-cyan/20 focus:outline-none";

export function NewProjectForm({ services }: { services: string[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    service: "",
    description: "",
    budget: "",
    company: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/portal/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);
    const data = (await response?.json().catch(() => ({}))) as {
      projectId?: string;
      error?: string;
    };
    setBusy(false);
    if (!response?.ok) {
      setError(
        data?.error ?? "Couldn't send. Check your connection and try again.",
      );
      return;
    }
    router.push(
      data.projectId ? `/dashboard/projects/${data.projectId}` : "/dashboard",
    );
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-28 pb-20 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> All projects
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-white">
        Start a new project
      </h1>
      <p className="mt-2 text-sm text-white/60">
        Tell us what you need. You&rsquo;ll get updates here and by email.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-7"
      >
        <Field
          label="Project name"
          hint="Optional — e.g. “Booking app for my clinic”"
        >
          <input
            className={`${field} h-12`}
            value={form.title}
            onChange={(e) => set("title")(e.target.value)}
            maxLength={160}
          />
        </Field>
        <Field label="Service needed">
          <select
            className={`${field} h-12`}
            value={form.service}
            onChange={(e) => set("service")(e.target.value)}
            required
          >
            <option value="" disabled>
              Choose a service
            </option>
            {services.map((s) => (
              <option key={s} value={s} className="bg-canvas">
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="What do you want to build?"
          hint="Goals, main features, timeline — at least 20 characters."
        >
          <textarea
            className={`${field} resize-y py-3 leading-relaxed`}
            rows={6}
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            required
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Budget range" hint="Optional">
            <select
              className={`${field} h-12`}
              value={form.budget}
              onChange={(e) => set("budget")(e.target.value)}
            >
              <option value="">Not sure</option>
              {budgetOptions.map((b) => (
                <option key={b} value={b} className="bg-canvas">
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Company" hint="Optional">
            <input
              className={`${field} h-12`}
              value={form.company}
              onChange={(e) => set("company")(e.target.value)}
              maxLength={160}
            />
          </Field>
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-lg bg-red-400/10 px-3 py-2 text-sm text-red-200"
          >
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-blue to-brand-violet text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
        >
          {busy ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Send project
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/85">{label}</span>
      {hint ? (
        <span className="mt-0.5 block text-xs text-white/50">{hint}</span>
      ) : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
