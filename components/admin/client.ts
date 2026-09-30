export type {
  FitDecision,
  InboxFilter,
  InboxStats,
  MessageDetail,
  MessageSummary,
} from "@/lib/admin/inbox";
export type { ProjectRules } from "@/lib/admin/rules";

export class AdminRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** JSON fetch for the admin API; a lapsed session sends the user to sign in. */
export async function adminFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body ? { "content-type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new AdminRequestError(
      "Can't reach the server. Check your internet connection and try again.",
      0,
    );
  }
  if (response.status === 401) {
    // A full page load, not a client-side route change, so no admin data
    // stays in memory once the session has ended.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/login";
    throw new AdminRequestError("Signed out.", 401);
  }
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!response.ok) {
    throw new AdminRequestError(
      data.error ?? `Request failed (${response.status}).`,
      response.status,
    );
  }
  return data;
}

export function formatDate(iso: string, withTime = false) {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    hour: withTime ? "numeric" : undefined,
    minute: withTime ? "2-digit" : undefined,
  });
}

export function relativeTime(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(iso);
}

/** Inbox section headings: Today, Yesterday, This week, then month names. */
export function dateGroup(iso: string) {
  const date = new Date(iso);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const day = 86_400_000;
  const diff = startOfToday.getTime() - date.getTime();
  if (diff <= 0) return "Today";
  if (diff <= day) return "Yesterday";
  if (diff <= 6 * day) return "This week";
  const sameYear = date.getFullYear() === startOfToday.getFullYear();
  return date.toLocaleString(undefined, {
    month: "long",
    year: sameYear ? undefined : "numeric",
  });
}

export function waitingFor(iso: string) {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (hours < 1) return "under an hour";
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1 day" : `${days} days`;
}
