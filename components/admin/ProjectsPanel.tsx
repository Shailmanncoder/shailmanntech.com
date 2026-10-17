"use client";

import { FolderKanban, LoaderCircle, Send } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import type {
  Project,
  ProjectStatus,
  ProjectUpdate,
} from "@/lib/portal/projects";
import {
  ProgressBar,
  STATUS_TEXT,
  StatusBadge,
  formatWhen,
} from "@/components/portal/status";
import { adminFetch } from "./client";
import { Button, Card, Skeleton, useToast } from "./ui";
import { Linkify } from "@/components/ui/Linkify";

const STATUSES = Object.keys(STATUS_TEXT) as ProjectStatus[];
type Detail = { project: Project; updates: ProjectUpdate[] };

/** Client projects: post status, progress and messages; each update emails the client. */
export function ProjectsPanel() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [filter, setFilter] = useState<"active" | "waiting" | "all">("active");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [form, setForm] = useState({
    body: "",
    status: "" as ProjectStatus | "",
    progress: 0,
    notify: true,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ projects: Project[] }>(
        "/api/admin/projects",
      );
      setProjects(data.projects);
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't load projects.",
      });
    }
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    adminFetch<Detail>(`/api/admin/projects/${selected}`)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setForm({
          body: "",
          status: data.project.status,
          progress: data.project.progress,
          notify: true,
        });
      })
      .catch((e: Error) => toast({ tone: "error", text: e.message }));
    return () => {
      cancelled = true;
    };
  }, [selected, toast]);

  async function post(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setSaving(true);
    try {
      const data = await adminFetch<Detail & { emailed: boolean }>(
        `/api/admin/projects/${detail.project.id}/updates`,
        {
          method: "POST",
          body: {
            body: form.body,
            status: form.status !== detail.project.status ? form.status : null,
            progress:
              form.progress !== detail.project.progress ? form.progress : null,
            notify: form.notify,
          },
        },
      );
      setDetail(data);
      setForm((f) => ({ ...f, body: "" }));
      toast({
        tone: "ok",
        text: data.emailed
          ? `Update posted and emailed to ${data.project.email}.`
          : "Update posted.",
      });
      load();
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't post.",
      });
    }
    setSaving(false);
  }

  const shown = (projects ?? []).filter((p) =>
    filter === "all"
      ? true
      : filter === "waiting"
        ? p.awaitingTeam
        : !["completed", "declined"].includes(p.status),
  );
  const changed =
    detail &&
    (form.body.trim() !== "" ||
      form.status !== detail.project.status ||
      form.progress !== detail.project.progress);

  return (
    <main className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <section
        className={cn(
          "border-white/[0.06] lg:border-r",
          selected && "hidden lg:block",
        )}
        aria-label="Projects"
      >
        <div className="border-b border-white/[0.06] px-5 pt-5 pb-3">
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-[-0.02em] text-white">
            <FolderKanban aria-hidden="true" className="size-5 text-cyan-200" />{" "}
            Projects
          </h1>
          <div className="mt-3 flex gap-1.5">
            {(
              [
                ["active", "Active"],
                ["waiting", "Client waiting"],
                ["all", "All"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs",
                  filter === key
                    ? "bg-white text-canvas"
                    : "border border-white/10 text-white/70 hover:text-white",
                )}
              >
                {label}
                {key === "waiting" && projects
                  ? ` · ${projects.filter((p) => p.awaitingTeam).length}`
                  : ""}
              </button>
            ))}
          </div>
        </div>
        {projects === null ? (
          <div className="flex flex-col gap-3 p-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="p-8 text-center text-sm text-white/60">
            No projects here.
          </p>
        ) : (
          <ul>
            {shown.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(p.id)}
                  aria-current={selected === p.id ? "true" : undefined}
                  className={cn(
                    "block w-full border-b border-white/[0.04] px-5 py-4 text-left hover:bg-white/[0.03]",
                    selected === p.id && "bg-white/[0.07]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {p.awaitingTeam ? (
                      <span
                        className="size-2 shrink-0 rounded-full bg-brand-cyan"
                        aria-label="Client waiting for a reply"
                      />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                      {p.title}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-white/60">
                    {p.name || p.email} · {formatWhen(p.updatedAt)}
                  </span>
                  <span className="mt-2 flex items-center gap-3">
                    <StatusBadge status={p.status} />
                    <span className="flex-1">
                      <ProgressBar value={p.progress} label={false} />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className={cn("min-w-0", !selected && "hidden lg:block")}
        aria-label="Project"
      >
        {!selected ? (
          <div className="flex h-full min-h-[50svh] items-center justify-center p-8 text-sm text-white/60">
            Select a project to post an update.
          </div>
        ) : !detail || detail.project.id !== selected ? (
          <div className="p-8">
            <Skeleton className="h-64" />
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-8">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="self-start text-sm text-white/60 hover:text-white lg:hidden"
            >
              ← Projects
            </button>
            <header>
              <StatusBadge status={detail.project.status} />
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-white">
                {detail.project.title}
              </h2>
              <p className="mt-1 text-sm text-white/60">
                {detail.project.name} · {detail.project.email} ·{" "}
                {detail.project.service}
                {detail.project.budget ? ` · ${detail.project.budget}` : ""}
              </p>
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-white/75">
                <Linkify text={detail.project.description} />
              </p>
            </header>

            <Card className="p-5">
              <h3 className="text-sm font-semibold">Timeline</h3>
              {detail.updates.length === 0 ? (
                <p className="mt-3 text-sm text-white/60">No updates yet.</p>
              ) : (
                <ol className="mt-4 flex flex-col gap-3">
                  {detail.updates.map((u) => (
                    <li
                      key={u.id}
                      className={cn(
                        "rounded-xl border p-4 text-sm",
                        u.author === "team"
                          ? "border-brand-cyan/20 bg-brand-cyan/[0.04]"
                          : "border-white/[0.08] bg-white/[0.02]",
                      )}
                    >
                      <p className="flex justify-between gap-3 text-xs text-white/60">
                        <span className="font-medium text-white/85">
                          {u.author === "team" ? "You" : "Client"}
                        </span>
                        <span>{formatWhen(u.createdAt, true)}</span>
                      </p>
                      {u.status || u.progress !== null ? (
                        <p className="mt-1.5 text-xs text-white/70">
                          {u.status ? `Status → ${STATUS_TEXT[u.status]}` : ""}
                          {u.status && u.progress !== null ? " · " : ""}
                          {u.progress !== null
                            ? `Progress → ${u.progress}%`
                            : ""}
                        </p>
                      ) : null}
                      {u.body ? (
                        <p className="mt-2 whitespace-pre-wrap text-white/80">
                          <Linkify text={u.body} />
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <Card className="p-5">
              <form onSubmit={post} className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold">Post an update</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs text-white/70">
                    Status
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          status: e.target.value as ProjectStatus,
                        }))
                      }
                      className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-canvas">
                          {STATUS_TEXT[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs text-white/70">
                    Progress:{" "}
                    <span className="text-white tabular-nums">
                      {form.progress}%
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={form.progress}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          progress: Number(e.target.value),
                        }))
                      }
                      className="mt-3 w-full accent-cyan-400"
                    />
                  </label>
                </div>
                <textarea
                  rows={5}
                  value={form.body}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, body: e.target.value }))
                  }
                  placeholder="What's new? The client sees this on their project page."
                  aria-label="Update message"
                  className="w-full resize-y rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-white placeholder:text-white/50 focus:border-brand-cyan/50 focus:outline-none"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-white/75">
                    <input
                      type="checkbox"
                      checked={form.notify}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notify: e.target.checked }))
                      }
                      className="size-4 accent-cyan-400"
                    />
                    Email the client
                  </label>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={saving || !changed}
                  >
                    {saving ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : (
                      <Send aria-hidden="true" className="size-4" />
                    )}
                    Post update
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </section>
    </main>
  );
}
