"use client";

import { ArrowLeft, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import type { Project, ProjectUpdate } from "@/lib/portal/projects";
import { ProgressBar, STATUS_TEXT, StatusBadge, When } from "./status";

export function ProjectView({
  initial,
}: {
  initial: { project: Project; updates: ProjectUpdate[] };
}) {
  const [data, setData] = useState(initial);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const { project, updates } = data;

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (message.trim().length < 2) return;
    setSending(true);
    setError("");
    const response = await fetch(
      `/api/portal/projects/${project.id}/messages`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: message }),
      },
    ).catch(() => null);
    setSending(false);
    if (!response?.ok) {
      const body = (await response?.json().catch(() => ({}))) as
        { error?: string } | undefined;
      setError(
        body?.error ?? "Couldn't send. Check your connection and try again.",
      );
      return;
    }
    setData(await response.json());
    setMessage("");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-28 pb-20 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> All projects
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={project.status} />
          <span className="text-xs text-white/50">
            Sent <When iso={project.createdAt} />
          </span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-balance text-white sm:text-3xl">
          {project.title}
        </h1>
        <div className="mt-5 max-w-md">
          <ProgressBar value={project.progress} />
        </div>
      </header>

      <section
        className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6"
        aria-labelledby="request-heading"
      >
        <h2 id="request-heading" className="text-sm font-semibold text-white">
          Your request
        </h2>
        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          {[
            ["Service", project.service],
            ["Budget", project.budget || "—"],
            ["Company", project.company || "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-white/50">{label}</dt>
              <dd className="mt-0.5 text-white/85">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm leading-relaxed whitespace-pre-wrap text-white/75">
          {project.description}
        </p>
      </section>

      <section className="mt-10" aria-labelledby="updates-heading">
        <h2 id="updates-heading" className="text-sm font-semibold text-white">
          Updates
        </h2>
        {updates.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-white/60">
            No updates yet. We read every request and will reply here and by
            email.
          </p>
        ) : (
          <ol className="mt-5 flex flex-col gap-4 border-l border-white/10 pl-5">
            {updates.map((u) => (
              <li key={u.id} className="relative">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-5 -left-[1.6rem] size-2.5 rounded-full ring-4 ring-canvas",
                    u.author === "team" ? "bg-brand-cyan" : "bg-white/40",
                  )}
                />
                <div
                  className={cn(
                    "rounded-2xl border p-4 sm:p-5",
                    u.author === "team"
                      ? "border-brand-cyan/20 bg-brand-cyan/[0.04]"
                      : "border-white/[0.08] bg-white/[0.02]",
                  )}
                >
                  <p className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-white/60">
                    <span className="font-medium text-white/85">
                      {u.author === "team" ? "Shailmann Tech" : "You"}
                    </span>
                    <When iso={u.createdAt} withTime />
                  </p>
                  {u.status || u.progress !== null ? (
                    <p className="mt-2 flex flex-wrap gap-2 text-xs">
                      {u.status ? (
                        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-white/80">
                          Status → {STATUS_TEXT[u.status]}
                        </span>
                      ) : null}
                      {u.progress !== null ? (
                        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-white/80">
                          Progress → {u.progress}%
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  {u.body ? (
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-white/80">
                      {u.body}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <form
        onSubmit={send}
        className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5"
      >
        <label
          htmlFor="project-message"
          className="text-sm font-semibold text-white"
        >
          Message us about this project
        </label>
        <textarea
          id="project-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a question, share feedback or add details…"
          className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed text-white placeholder:text-white/40 focus:border-brand-cyan/50 focus:ring-2 focus:ring-brand-cyan/20 focus:outline-none"
        />
        {error ? (
          <p role="alert" className="mt-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-white/50">
            We&rsquo;ll reply here and by email.
          </p>
          <button
            type="submit"
            disabled={sending || message.trim().length < 2}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-brand-blue to-brand-violet px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {sending ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : (
              <Send aria-hidden="true" className="size-4" />
            )}
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
