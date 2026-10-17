"use client";

import {
  ArrowRight,
  FolderOpen,
  LogOut,
  Mail,
  MessageCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/portal/projects";
import { ProgressBar, StatusBadge, When } from "./status";
import { Linkify } from "@/components/ui/Linkify";

type Mail = { from: "them" | "us"; subject: string; body: string; at: string };

export function Dashboard({
  name,
  email,
  projects,
}: {
  name: string;
  email: string;
  projects: Project[];
}) {
  const [tab, setTab] = useState<"projects" | "emails">("projects");
  const [mail, setMail] = useState<Mail[] | null>(null);
  const [mailError, setMailError] = useState("");

  useEffect(() => {
    if (tab !== "emails" || mail) return;
    let cancelled = false;
    fetch("/api/portal/conversation")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then(
        (data: { messages: Mail[] }) => !cancelled && setMail(data.messages),
      )
      .catch(
        () =>
          !cancelled &&
          setMailError("Couldn't load your emails. Please refresh."),
      );
    return () => {
      cancelled = true;
    };
  }, [tab, mail]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/");
  }

  const active = projects.filter(
    (p) => !["completed", "declined"].includes(p.status),
  );
  const first = name.split(" ")[0] || "there";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-28 pb-20 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">{email}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Hi {first}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {projects.length === 0
              ? "You haven't sent us a project yet."
              : `${active.length} active ${active.length === 1 ? "project" : "projects"}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-brand-blue to-brand-violet px-4 text-sm font-semibold text-white hover:brightness-110"
          >
            <Plus aria-hidden="true" className="size-4" />
            New project
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white/80 hover:bg-white/[0.08] hover:text-white"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Sign out
          </button>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Dashboard"
        className="mt-10 flex gap-1 border-b border-white/10"
      >
        {(
          [
            ["projects", "Projects", FolderOpen],
            ["emails", "Emails", Mail],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors",
              tab === key
                ? "border-brand-cyan text-white"
                : "border-transparent text-white/60 hover:text-white",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
            {key === "projects" ? (
              <span className="rounded-md bg-white/[0.08] px-1.5 text-xs tabular-nums">
                {projects.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "projects" ? (
        projects.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
            <FolderOpen aria-hidden="true" className="size-8 text-white/40" />
            <p className="mt-4 text-base font-medium text-white">
              No projects yet
            </p>
            <p className="mt-1 max-w-sm text-sm text-white/60">
              Tell us what you&rsquo;d like to build. You&rsquo;ll follow its
              progress and our updates right here.
            </p>
            <Link
              href="/dashboard/new"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-canvas hover:bg-white/90"
            >
              Start a project{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-linear-to-b from-white/[0.04] to-white/[0.015] p-5 transition hover:border-white/20 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <StatusBadge status={project.status} />
                    <span className="text-xs text-white/50">
                      Updated <When iso={project.updatedAt} />
                    </span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold tracking-[-0.015em] text-white group-hover:text-cyan-100">
                    {project.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-sm text-white/60">
                    {project.description}
                  </p>
                  <div className="mt-auto pt-5">
                    <ProgressBar value={project.progress} />
                  </div>
                  {project.awaitingTeam ? (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-white/60">
                      <MessageCircle aria-hidden="true" className="size-3.5" />
                      Your message is with us
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="mt-8">
          {mailError ? (
            <p role="alert" className="text-sm text-red-200">
              {mailError}
            </p>
          ) : !mail ? (
            <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
          ) : mail.length === 0 ? (
            <p className="text-sm text-white/60">No emails between us yet.</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {mail.map((m, i) => (
                <li
                  key={i}
                  className={cn(
                    "rounded-2xl border p-5",
                    m.from === "us"
                      ? "border-brand-cyan/20 bg-brand-cyan/[0.04]"
                      : "border-white/[0.08] bg-white/[0.02]",
                  )}
                >
                  <p className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-white/60">
                    <span className="font-medium text-white/85">
                      {m.from === "us" ? "Shailmann Tech" : "You"}
                    </span>
                    <When iso={m.at} withTime />
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {m.subject}
                  </p>
                  <p className="mt-2 line-clamp-6 text-sm leading-relaxed whitespace-pre-wrap text-white/70">
                    <Linkify text={m.body} />
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
