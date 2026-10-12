"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Turnstile, turnstileSiteKey } from "@/components/forms/Turnstile";
import { LogoMark } from "@/components/ui/Logo";
import { site } from "@/lib/site";

type Mode = "login" | "signup" | "verify" | "forgot" | "reset";

const GOOGLE_ERRORS: Record<string, string> = {
  google_off: "Google sign-in isn't set up yet. Use your email instead.",
  google_cancelled: "Google sign-in was cancelled.",
  google_failed: "Google sign-in didn't work. Please try again.",
  unavailable: "Sign-in isn't available right now. Please try again later.",
};

const field =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[0.9375rem] text-white " +
  "placeholder:text-white/40 transition-colors focus:border-brand-cyan/50 focus:bg-white/[0.05] " +
  "focus:outline-none focus:ring-2 focus:ring-brand-cyan/20";

async function post(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!response)
    return {
      ok: false,
      error: "Can't reach the server. Check your connection.",
    };
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    next?: Mode;
    email?: string;
  };
  return { ok: response.ok, ...data };
}

export function AuthForm({
  initialMode,
  googleEnabled,
  errorCode,
}: {
  initialMode: "login" | "signup";
  googleEnabled: boolean;
  errorCode?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    errorCode ? (GOOGLE_ERRORS[errorCode] ?? "") : "",
  );
  const [notice, setNotice] = useState("");
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

  function go(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
    setCode("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const result =
      mode === "login"
        ? await post("/api/auth/login", { email, password })
        : mode === "signup"
          ? await post("/api/auth/signup", {
              name,
              email,
              password,
              turnstileToken: token,
            })
          : mode === "verify"
            ? await post("/api/auth/verify", { email, code })
            : mode === "forgot"
              ? await post("/api/auth/forgot", { email })
              : await post("/api/auth/reset", { email, code, password });

    if (mode === "signup") setResetKey((n) => n + 1);
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    if (result.next === "verify") {
      go("verify");
      setNotice(`We emailed a 6-digit code to ${email}.`);
      return;
    }
    if (result.next === "reset") {
      go("reset");
      setPassword("");
      setNotice(`If ${email} has an account, we've emailed it a 6-digit code.`);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  async function resend() {
    setBusy(true);
    const result = await post("/api/auth/resend", {
      email,
      purpose: mode === "reset" ? "reset" : "verify",
    });
    setBusy(false);
    if (result.ok) setNotice(`A new code is on its way to ${email}.`);
    else setError(result.error ?? "Couldn't send a new code.");
  }

  const titles: Record<Mode, [string, string]> = {
    login: ["Welcome back", "Log in to see your projects."],
    signup: [
      "Create your account",
      "Track your projects and our updates in one place.",
    ],
    verify: ["Check your email", "Enter the 6-digit code we sent you."],
    forgot: ["Reset your password", "We'll email you a code."],
    reset: [
      "Set a new password",
      "Enter the code from your email and a new password.",
    ],
  };
  const needsPassword =
    mode === "login" || mode === "signup" || mode === "reset";
  const needsCode = mode === "verify" || mode === "reset";
  const signupBlocked =
    mode === "signup" && Boolean(turnstileSiteKey) && !token;

  return (
    <div className="w-full max-w-[26rem]">
      <div className="flex flex-col items-center text-center">
        {mode === "verify" ? (
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
            <MailCheck aria-hidden="true" className="size-6" />
          </span>
        ) : (
          <LogoMark className="size-12" />
        )}
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-white">
          {titles[mode][0]}
        </h1>
        <p className="mt-2 text-sm text-white/60">{titles[mode][1]}</p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-linear-to-b from-white/[0.05] to-white/[0.02] p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] sm:p-7">
        {googleEnabled && (mode === "login" || mode === "signup") ? (
          <>
            <a
              href="/api/auth/google"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white text-sm font-semibold text-[#1f1f1f] transition hover:bg-white/90"
            >
              <GoogleMark />
              Continue with Google
            </a>
            <div className="my-6 flex items-center gap-3 text-xs text-white/50">
              <span className="h-px flex-1 bg-white/10" />
              or with email
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </>
        ) : null}

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {mode === "signup" ? (
            <Field label="Your name" htmlFor="auth-name">
              <input
                id="auth-name"
                className={field}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
          ) : null}

          {mode !== "verify" && mode !== "reset" ? (
            <Field label="Email" htmlFor="auth-email">
              <input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className={field}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
          ) : null}

          {needsCode ? (
            <Field label="6-digit code" htmlFor="auth-code">
              <input
                id="auth-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                className={`${field} text-center font-mono text-xl tracking-[0.5em]`}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
                required
              />
            </Field>
          ) : null}

          {needsPassword ? (
            <Field
              label={mode === "reset" ? "New password" : "Password"}
              htmlFor="auth-password"
              hint={mode === "login" ? undefined : "At least 10 characters."}
              action={
                mode === "login" ? (
                  <button
                    type="button"
                    onClick={() => go("forgot")}
                    className="text-xs text-white/60 hover:text-white"
                  >
                    Forgot password?
                  </button>
                ) : undefined
              }
            >
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className={`${field} pr-12`}
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
            </Field>
          ) : null}

          {mode === "signup" && turnstileSiteKey ? (
            <Turnstile
              siteKey={turnstileSiteKey}
              onToken={setToken}
              resetKey={resetKey}
            />
          ) : null}

          {notice ? (
            <p
              role="status"
              className="rounded-lg bg-brand-cyan/10 px-3 py-2 text-sm text-cyan-100"
            >
              {notice}
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2 text-sm text-red-200"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || signupBlocked}
            className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-blue to-brand-violet text-sm font-semibold text-white shadow-[0_12px_32px_-12px_rgba(99,102,241,0.8)] transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            {
              {
                login: "Log in",
                signup: "Create account",
                verify: "Verify and continue",
                forgot: "Email me a code",
                reset: "Save new password",
              }[mode]
            }
            {!busy ? (
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            ) : null}
          </button>
        </form>

        {needsCode ? (
          <p className="mt-5 text-center text-sm text-white/60">
            No code?{" "}
            <button
              type="button"
              onClick={resend}
              disabled={busy}
              className="text-white underline underline-offset-4 disabled:opacity-50"
            >
              Send a new one
            </button>
          </p>
        ) : null}
      </div>

      <p className="mt-6 text-center text-sm text-white/60">
        {mode === "login" ? (
          <>
            New here?{" "}
            <button
              type="button"
              onClick={() => go("signup")}
              className="font-medium text-white underline underline-offset-4"
            >
              Create an account
            </button>
          </>
        ) : mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => go("login")}
              className="font-medium text-white underline underline-offset-4"
            >
              Log in
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => go("login")}
            className="font-medium text-white underline underline-offset-4"
          >
            Back to log in
          </button>
        )}
      </p>
      <p className="mt-3 text-center text-xs text-white/50">
        Client portal · {site.domain}
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  action,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[0.8125rem] font-medium text-white/75"
        >
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-white/50">{hint}</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
