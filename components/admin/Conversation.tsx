"use client";
import { useState } from "react";
import { adminFetch } from "./client";
import { Button, Card } from "./ui";
type Item = {
  id: string;
  subject: string;
  body: string;
  direction: string;
  at: string;
};
export function Conversation({ id }: { id: string }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    setError("");
    try {
      setItems(
        (
          await adminFetch<{ items: Item[] }>(
            `/api/admin/messages/${id}/conversation`,
          )
        ).items,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="space-y-3 p-5">
      <div className="flex flex-wrap justify-between gap-2">
        <h2 className="font-semibold">Client conversation</h2>
        <Button onClick={load} disabled={busy}>
          {busy
            ? "Loading…"
            : items
              ? "Refresh conversation"
              : "Show conversation"}
        </Button>
      </div>
      <p className="text-xs text-white/60">
        Latest 100 messages and sent replies with this client, across subjects
        and synced folders.
      </p>
      {error ? <p role="alert">{error}</p> : null}
      {items ? (
        <ol className="space-y-3">
          {items.map((m) => (
            <li key={m.id}>
              <details className="rounded-lg border border-white/10 p-3">
                <summary className="cursor-pointer text-sm">
                  <span className="text-cyan-200">
                    {m.direction === "outgoing" ? "You sent" : "Received"}
                  </span>{" "}
                  · {new Date(m.at).toLocaleString()} · {m.subject}
                </summary>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-white/75">
                  {m.body}
                </p>
              </details>
            </li>
          ))}
        </ol>
      ) : null}
    </Card>
  );
}
