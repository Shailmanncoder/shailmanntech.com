"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      appearance?: "always" | "execute" | "interaction-only";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;

function loadScript() {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile failed to load."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare's spam check. It stays invisible for most visitors and only
 * shows a checkbox when Cloudflare wants an interaction. Bump `resetKey` after
 * each submission — a token can only be verified once.
 */
export function Turnstile({
  siteKey,
  onToken,
  resetKey,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  resetKey: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "dark",
          appearance: "interaction-only",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => onTokenRef.current(""),
        });
      })
      .catch(() => onTokenRef.current(""));

    return () => {
      cancelled = true;
      if (widgetRef.current) window.turnstile?.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey === 0 || !widgetRef.current) return;
    onTokenRef.current("");
    window.turnstile?.reset(widgetRef.current);
  }, [resetKey]);

  return <div ref={containerRef} className="empty:hidden" />;
}
