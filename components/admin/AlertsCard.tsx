"use client";

import {
  BellRing,
  Check,
  Copy,
  LoaderCircle,
  Send,
  Search,
} from "lucide-react";
import { useState } from "react";
import { adminFetch } from "./client";
import { Button, Card, useToast } from "./ui";

type Chat = { id: string; name: string };

/** Setting up Telegram lead alerts: find the chat ID, then send a test. */
export function AlertsCard() {
  const toast = useToast();
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [busy, setBusy] = useState<"find" | "test" | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function findChats() {
    setBusy("find");
    try {
      const data = await adminFetch<{ chats: Chat[] }>("/api/admin/alerts");
      setChats(data.chats);
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't ask Telegram.",
      });
    }
    setBusy(null);
  }

  async function sendTest() {
    setBusy("test");
    try {
      await adminFetch("/api/admin/alerts", { method: "POST" });
      toast({ tone: "ok", text: "Test alert sent. Check Telegram." });
    } catch (e) {
      toast({
        tone: "error",
        text: e instanceof Error ? e.message : "Couldn't send.",
      });
    }
    setBusy(null);
  }

  return (
    <Card className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <BellRing
          aria-hidden="true"
          className="size-5 shrink-0 text-cyan-200"
        />
        <div className="min-w-0 flex-1 basis-60">
          <h2 className="text-sm font-semibold text-white">
            Lead alerts on Telegram
          </h2>
          <p className="mt-0.5 text-sm text-white/60">
            Good-fit leads are sent to your phone the moment they arrive.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={findChats} disabled={busy !== null}>
            {busy === "find" ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : (
              <Search aria-hidden="true" className="size-4" />
            )}
            Find my chat ID
          </Button>
          <Button onClick={sendTest} disabled={busy !== null}>
            {busy === "test" ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : (
              <Send aria-hidden="true" className="size-4" />
            )}
            Send test alert
          </Button>
        </div>
      </div>

      {chats ? (
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm">
          {chats.length === 0 ? (
            <p className="text-white/60">
              No messages yet. Open your bot in Telegram, send it any message
              (like &ldquo;hi&rdquo;), then click{" "}
              <b className="text-white/80">Find my chat ID</b> again.
            </p>
          ) : (
            <>
              <p className="text-white/60">
                Put this number in Vercel as{" "}
                <code className="text-white/85">TELEGRAM_CHAT_ID</code>, then
                redeploy:
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {chats.map((chat) => (
                  <li key={chat.id} className="flex items-center gap-3">
                    <code className="rounded-md bg-black/40 px-2 py-1 font-mono text-white">
                      {chat.id}
                    </code>
                    <span className="text-white/60">{chat.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(chat.id);
                        setCopied(chat.id);
                        setTimeout(() => setCopied(null), 1500);
                      }}
                      className="ml-auto rounded-md p-1.5 text-white/60 hover:bg-white/5 hover:text-white"
                      aria-label={`Copy chat ID ${chat.id}`}
                    >
                      {copied === chat.id ? (
                        <Check aria-hidden="true" className="size-4" />
                      ) : (
                        <Copy aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </Card>
  );
}
