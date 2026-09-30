"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "./client";
import { Button, Card, useToast } from "./ui";
import { LEAD_STAGES, type LeadStage } from "@/lib/admin/workspace-validation";
export type Lead = {
  email: string;
  name: string;
  stage: LeadStage;
  notes: string;
  tags: string[];
  followUpAt: string | null;
};
export type Template = { id: string; title: string; body: string };
const labels: Record<LeadStage, string> = {
  new: "New",
  discussing: "Discussing",
  proposal: "Proposal sent",
  won: "Won",
  lost: "Lost",
};
const field =
  "w-full rounded-lg border border-white/15 bg-canvas px-3 py-2 text-sm text-white";
export const blankLead = (email = "", name = ""): Lead => ({
  email,
  name,
  stage: "new",
  notes: "",
  tags: [],
  followUpAt: null,
});
function localDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function LeadEditor({
  initial,
  onSaved,
}: {
  initial: Lead;
  onSaved?: (lead: Lead) => void;
}) {
  const [lead, setLead] = useState(initial);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function save() {
    setBusy(true);
    try {
      const data = await adminFetch<{ lead: Lead }>("/api/admin/leads", {
        method: "PUT",
        body: lead,
      });
      onSaved?.(data.lead);
      toast({ tone: "ok", text: "Client details saved." });
    } catch (e) {
      toast({ tone: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="text-sm">
        Client name
        <input
          className={field}
          value={lead.name}
          onChange={(e) => setLead({ ...lead, name: e.target.value })}
          maxLength={120}
        />
      </label>
      <label className="text-sm">
        Email
        <input
          required
          type="email"
          className={field}
          value={lead.email}
          readOnly={Boolean(initial.email)}
          onChange={(e) => setLead({ ...lead, email: e.target.value })}
        />
      </label>
      <label className="text-sm">
        Lead stage
        <select
          className={field}
          value={lead.stage}
          onChange={(e) =>
            setLead({ ...lead, stage: e.target.value as LeadStage })
          }
        >
          {LEAD_STAGES.map((s) => (
            <option key={s} value={s}>
              {labels[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Follow up on
        <input
          type="datetime-local"
          className={field}
          value={localDate(lead.followUpAt)}
          onChange={(e) =>
            setLead({
              ...lead,
              followUpAt: e.target.value
                ? new Date(e.target.value).toISOString()
                : null,
            })
          }
        />
      </label>
      <label className="text-sm sm:col-span-2">
        Tags (comma separated)
        <input
          className={field}
          defaultValue={lead.tags.join(", ")}
          onChange={(e) =>
            setLead({
              ...lead,
              tags: e.target.value.split(",").map((t) => t.trim()),
            })
          }
          maxLength={480}
        />
      </label>
      <label className="text-sm sm:col-span-2">
        Private client notes
        <textarea
          className={field}
          rows={4}
          value={lead.notes}
          onChange={(e) => setLead({ ...lead, notes: e.target.value })}
          maxLength={10000}
        />
      </label>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save client"}
        </Button>
        {lead.followUpAt ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setLead({ ...lead, followUpAt: null })}
          >
            Clear follow-up date
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-white/60 sm:col-span-2">
        Follow-ups appear in the Due follow-ups list when you open this
        workspace. Dates use your device’s time zone.
      </p>
    </form>
  );
}
export function WorkspacePanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editor, setEditor] = useState<Lead | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const toast = useToast();
  useEffect(() => {
    let active = true;
    Promise.all([
      adminFetch<{ leads: Lead[] }>("/api/admin/leads"),
      adminFetch<{ templates: Template[] }>("/api/admin/templates"),
    ])
      .then(([l, t]) => {
        if (active) {
          setLeads(l.leads);
          setTemplates(t.templates);
          setReady(true);
        }
      })
      .catch((e) => toast({ tone: "error", text: e.message }));
    return () => {
      active = false;
    };
  }, [toast]);
  async function saveTemplate() {
    if (!template) return;
    setBusy(true);
    try {
      const data = await adminFetch<{ templates: Template[] }>(
        "/api/admin/templates",
        { method: "PUT", body: template },
      );
      setTemplates(data.templates);
      setTemplate(null);
      toast({ tone: "ok", text: "Template saved." });
    } catch (e) {
      toast({ tone: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }
  const visible = leads.filter(
    (l) =>
      (filter === "all" ||
        (filter === "due"
          ? Boolean(l.followUpAt && new Date(l.followUpAt) <= new Date())
          : l.stage === filter)) &&
      `${l.name} ${l.email} ${l.tags.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <header>
        <h1 className="text-2xl font-semibold">Client workspace</h1>
        <p className="mt-2 text-sm text-white/60">
          Track enquiries, follow-ups and the replies you use most.
        </p>
      </header>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap justify-between gap-3">
          <h2 className="text-lg font-semibold">Leads & follow-ups</h2>
          <Button onClick={() => setEditor(blankLead())}>Add client</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex-1">
            Search clients
            <input
              className={field}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Show
            <select
              className={field}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All stages</option>
              <option value="due">Due follow-ups</option>
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!ready ? (
          <p>Loading clients…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-white/60">
            No matching clients. Add one here or save client details from an
            email.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {visible.map((l) => (
              <li key={l.email}>
                <button
                  type="button"
                  onClick={() => setEditor(l)}
                  className="w-full rounded-xl border border-white/10 p-4 text-left hover:bg-white/5"
                >
                  <strong className="block break-words">
                    {l.name || l.email}
                  </strong>
                  <span className="block break-all text-sm text-white/60">
                    {l.email}
                  </span>
                  <span className="mt-2 block text-sm text-cyan-200">
                    {labels[l.stage]}{" "}
                    {l.tags.length ? `· ${l.tags.join(", ")}` : ""}
                  </span>
                  {l.followUpAt ? (
                    <span className="mt-2 block text-sm text-amber-200">
                      {new Date(l.followUpAt) <= new Date()
                        ? "Due: "
                        : "Follow up: "}
                      {new Date(l.followUpAt).toLocaleString()}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
        {editor ? (
          <section className="border-t border-white/10 pt-4">
            <div className="mb-3 flex justify-between">
              <h3 className="font-semibold">Client details</h3>
              <Button variant="ghost" onClick={() => setEditor(null)}>
                Close editor
              </Button>
            </div>
            <LeadEditor
              key={editor.email}
              initial={editor}
              onSaved={(l) => {
                setLeads((current) => [
                  l,
                  ...current.filter((x) => x.email !== l.email),
                ]);
                setEditor(null);
              }}
            />
          </section>
        ) : null}
      </Card>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap justify-between gap-3">
          <h2 className="text-lg font-semibold">Saved reply templates</h2>
          <Button onClick={() => setTemplate({ id: "", title: "", body: "" })}>
            New template
          </Button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <li key={t.id}>
              <Button variant="ghost" onClick={() => setTemplate(t)}>
                {t.title}
              </Button>
            </li>
          ))}
        </ul>
        {template ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveTemplate();
            }}
          >
            <label className="block">
              Template title
              <input
                required
                className={field}
                maxLength={120}
                value={template.title}
                onChange={(e) =>
                  setTemplate({ ...template, title: e.target.value })
                }
              />
            </label>
            <label className="block">
              Reply text
              <textarea
                required
                className={field}
                rows={6}
                maxLength={10000}
                value={template.body}
                onChange={(e) =>
                  setTemplate({ ...template, body: e.target.value })
                }
              />
            </label>
            <Button type="submit" disabled={busy}>
              Save template
            </Button>{" "}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTemplate(null)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <p className="text-sm text-white/60">
            Choose a template to edit it. Templates insert into the reply editor
            for review before sending.
          </p>
        )}
      </Card>
    </div>
  );
}
export function ClientDetails({
  email,
  name,
  onTemplate,
}: {
  email: string;
  name: string;
  onTemplate: (body: string) => void;
}) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const toast = useToast();
  useEffect(() => {
    let active = true;
    Promise.all([
      adminFetch<{ leads: Lead[] }>("/api/admin/leads"),
      adminFetch<{ templates: Template[] }>("/api/admin/templates"),
    ])
      .then(([l, t]) => {
        if (active) {
          setLead(
            l.leads.find((x) => x.email === email.toLowerCase()) ??
              blankLead(email, name),
          );
          setTemplates(t.templates);
        }
      })
      .catch((e) => toast({ tone: "error", text: e.message }));
    return () => {
      active = false;
    };
  }, [email, name, toast]);
  return (
    <Card className="space-y-4 p-5">
      <details>
        <summary className="cursor-pointer font-semibold">
          Client details, notes & follow-up
        </summary>
        <div className="mt-4">
          {lead ? (
            <LeadEditor initial={lead} onSaved={setLead} />
          ) : (
            <p>Loading client details…</p>
          )}
        </div>
      </details>
      <label className="block text-sm">
        Insert saved reply
        <select
          className={field}
          defaultValue=""
          onChange={(e) => {
            const t = templates.find((t) => t.id === e.target.value);
            if (t) onTemplate(t.body);
            e.target.value = "";
          }}
        >
          <option value="">Choose a template…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
}
