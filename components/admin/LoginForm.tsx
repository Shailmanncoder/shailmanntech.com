"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LogoMark } from "@/components/ui/Logo";
import { site } from "@/lib/site";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(data.error ?? "Sign-in failed.");
    } catch {
      setError("Couldn't reach the server.");
    }
    setBusy(false);
  }

  const field =
    "h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-11 text-[0.9375rem] text-white " +
    "placeholder:text-white/50 transition-colors focus:border-brand-cyan/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-brand-cyan/20";

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_30%,rgba(99,102,241,0.18),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]"
      />

      <div className="relative w-full max-w-[25rem]">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="size-12 drop-shadow-[0_8px_24px_rgba(99,102,241,0.45)]" />
          <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Sign in to the {site.name} admin
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-8 rounded-2xl border border-white/10 bg-linear-to-b from-white/[0.05] to-white/[0.02] p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] backdrop-blur sm:p-7"
        >
          <label
            className="block text-[0.8125rem] font-medium text-white/70"
            htmlFor="admin-user"
          >
            Username
          </label>
          <div className="relative mt-2">
            <User
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/50"
            />
            <input
              id="admin-user"
              className={field}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <label
            className="mt-5 block text-[0.8125rem] font-medium text-white/70"
            htmlFor="admin-password"
          >
            Password
          </label>
          <div className="relative mt-2">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/50"
            />
            <input
              id="admin-password"
              className={`${field} pr-12`}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2 text-sm text-red-200"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-blue to-brand-violet text-sm font-semibold text-white shadow-[0_12px_32px_-12px_rgba(99,102,241,0.8)] transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            Sign in
            {!busy ? (
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            ) : null}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/50">
          Private area · {site.domain}
        </p>
      </div>
    </main>
  );
}
