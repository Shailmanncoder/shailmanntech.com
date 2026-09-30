"use client";

import {
  CircleCheck,
  CircleHelp,
  CircleX,
  LoaderCircle,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { adminFetch, relativeTime, type ProjectRules } from "./client";
import { Button, Card, Skeleton, useToast } from "./ui";

type Rules = ProjectRules & { updatedAt: string | null };

const EMPTY: ProjectRules = {
  takes: "",
  declines: "",
  minimumBudget: "",
  availability: "",
  notes: "",
};

export function RulesPanel() {
  const toast = useToast();
  const [saved, setSaved] = useState<Rules | null>(null);
  const [draft, setDraft] = useState<ProjectRules>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminFetch<Rules>("/api/admin/rules")
      .then((rules) => {
        if (cancelled) return;
        setSaved(rules);
        setDraft(rules);
        setLoadError("");
      })
      .catch((e: Error) => !cancelled && setLoadError(e.message));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const dirty =
    saved !== null &&
    (Object.keys(EMPTY) as (keyof ProjectRules)[]).some(
      (key) => draft[key] !== saved[key],
    );

  async function save() {
    setSaving(true);
    try {
      const rules = await adminFetch<Rules>("/api/admin/rules", {
        method: "PUT",
        body: draft,
      });
      setSaved(rules);
      setDraft(rules);
      toast({
        tone: "ok",
        text: "Project rules saved. New checks will use them.",
      });
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't save.",
      });
    }
    setSaving(false);
  }

  const set = (key: keyof ProjectRules) => (value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-[-0.03em] text-white">
            <SlidersHorizontal
              aria-hidden="true"
              className="size-5 text-cyan-200"
            />
            Project rules
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
            The AI checks every email from a person against these rules, decides
            whether it&rsquo;s a fit, and drafts a formal yes, a polite no, or a
            request for the missing details. You always review before anything
            is sent.
          </p>
        </div>
        {saved?.updatedAt ? (
          <p className="text-xs text-white/50">
            Saved {relativeTime(saved.updatedAt)}
          </p>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Outcome
          icon={<CircleCheck className="size-4 text-emerald-300" />}
          title="Good fit"
          body="Formal reply that accepts and proposes a call."
        />
        <Outcome
          icon={<CircleX className="size-4 text-rose-300" />}
          title="Not a fit"
          body="Polite, warm decline with a short reason."
        />
        <Outcome
          icon={<CircleHelp className="size-4 text-amber-200" />}
          title="Needs details"
          body="Asks for scope, budget or timeline first."
        />
      </div>

      {saved === null && loadError ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-6">
          <p role="alert" className="text-sm text-red-200">
            Couldn&rsquo;t load your rules. {loadError}
          </p>
          <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
        </Card>
      ) : saved === null ? (
        <Card className="flex flex-col gap-4 p-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-24" />
        </Card>
      ) : (
        <Card className="flex flex-col gap-6 p-5 sm:p-6">
          <Field
            label="Work we take on"
            hint="One per line. Starts from the services on your website."
            value={draft.takes}
            onChange={set("takes")}
            rows={9}
          />
          <Field
            label="Work we turn down"
            hint="e.g. WordPress themes, mobile games, crypto trading bots, unpaid equity-only work"
            value={draft.declines}
            onChange={set("declines")}
            rows={4}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              label="Minimum budget"
              hint="e.g. $2,000 or ₹1,50,000. Leave empty for no minimum."
              value={draft.minimumBudget}
              onChange={set("minimumBudget")}
            />
            <Field
              label="Availability"
              hint="e.g. Taking new projects now, or Booked until 15 November"
              value={draft.availability}
              onChange={set("availability")}
            />
          </div>
          <Field
            label="Anything else the AI should know"
            hint="e.g. We work remotely worldwide. Discovery calls are 20 minutes on Google Meet."
            value={draft.notes}
            onChange={set("notes")}
            rows={3}
          />
        </Card>
      )}

      <div className="sticky bottom-20 z-10 flex items-center justify-end gap-3 lg:bottom-6">
        {dirty ? (
          <span className="text-xs text-amber-200/80">Unsaved changes</span>
        ) : null}
        <Button
          variant="ghost"
          onClick={() => saved && setDraft(saved)}
          disabled={!dirty || saving}
        >
          Reset
        </Button>
        <Button variant="primary" onClick={save} disabled={!dirty || saving}>
          {saving ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          Save rules
        </Button>
      </div>
    </div>
  );
}

function Outcome({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-white">
        <span aria-hidden="true">{icon}</span>
        {title}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-white/50">{body}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  rows,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const className =
    "mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm leading-relaxed text-white " +
    "placeholder:text-white/50 focus:border-brand-cyan/50 focus:ring-2 focus:ring-brand-cyan/15 focus:outline-none";
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/85">{label}</span>
      <span className="mt-0.5 block text-xs text-white/50">{hint}</span>
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${className} resize-y py-3`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${className} h-11`}
        />
      )}
    </label>
  );
}
