import "server-only";
import { db } from "@/lib/admin/db";

/**
 * Client projects. A project belongs to an email address: the client sees
 * every project sent from the address they signed up with, including ones
 * from before they had an account.
 */

export const PROJECT_STATUSES = [
  "submitted",
  "reviewing",
  "proposal",
  "in_progress",
  "in_review",
  "completed",
  "on_hold",
  "declined",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  submitted: "Submitted",
  reviewing: "We're reviewing it",
  proposal: "Proposal sent",
  in_progress: "In progress",
  in_review: "Ready for your review",
  completed: "Completed",
  on_hold: "On hold",
  declined: "Not taken on",
};

export type Project = {
  id: string;
  email: string;
  name: string;
  title: string;
  service: string;
  description: string;
  budget: string;
  company: string;
  status: ProjectStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  /** Updates from the client not yet answered by the team. */
  awaitingTeam?: boolean;
};

export type ProjectUpdate = {
  id: string;
  author: "team" | "client";
  body: string;
  status: ProjectStatus | null;
  progress: number | null;
  createdAt: string;
};

type Row = {
  id: string;
  email: string;
  name: string;
  title: string;
  service: string;
  description: string;
  budget: string;
  company: string;
  status: ProjectStatus;
  progress: number;
  created_at: Date;
  updated_at: Date;
  awaiting_team?: boolean;
};

function toProject(row: Row): Project {
  return {
    id: String(row.id),
    email: row.email,
    name: row.name,
    title: row.title,
    service: row.service,
    description: row.description,
    budget: row.budget,
    company: row.company,
    status: row.status,
    progress: row.progress,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    awaitingTeam: row.awaiting_team,
  };
}

/** Whether the latest update on a project came from the client. */
const AWAITING_TEAM = `(
  select author = 'client' from project_updates u
  where u.project_id = p.id order by created_at desc limit 1
)`;

export async function projectsFor(email: string) {
  const sql = await db();
  const rows = await sql<Row[]>`
    select p.*, coalesce(${sql.unsafe(AWAITING_TEAM)}, false) as awaiting_team
    from projects p where email = ${email} order by updated_at desc`;
  return rows.map(toProject);
}

/** A project, only if it belongs to `email` (pass null for the admin). */
export async function getProject(id: string, email: string | null) {
  if (!/^\d+$/.test(id)) return null;
  const sql = await db();
  const [row] = await sql<Row[]>`
    select * from projects where id = ${id}
    ${email === null ? sql`` : sql`and email = ${email}`}`;
  if (!row) return null;
  const updates = await sql<
    {
      id: string;
      author: "team" | "client";
      body: string;
      status: ProjectStatus | null;
      progress: number | null;
      created_at: Date;
    }[]
  >`select * from project_updates where project_id = ${id} order by created_at`;
  return {
    project: toProject(row),
    updates: updates.map((u) => ({
      id: String(u.id),
      author: u.author,
      body: u.body,
      status: u.status,
      progress: u.progress,
      createdAt: u.created_at.toISOString(),
    })),
  };
}

export type NewProject = {
  email: string;
  name: string;
  title: string;
  service: string;
  description: string;
  budget?: string;
  company?: string;
  contactSubmissionId?: string | null;
};

export async function createProject(input: NewProject) {
  const sql = await db();
  const [row] = await sql<Row[]>`
    insert into projects (email, name, title, service, description, budget, company,
                          contact_submission_id)
    values (${input.email.toLowerCase()}, ${input.name}, ${input.title}, ${input.service},
            ${input.description}, ${input.budget ?? ""}, ${input.company ?? ""},
            ${input.contactSubmissionId ?? null})
    returning *`;
  return toProject(row);
}

export async function addClientMessage(projectId: string, body: string) {
  const sql = await db();
  const [row] = await sql<{ id: string }[]>`
    insert into project_updates (project_id, author, body)
    values (${projectId}, 'client', ${body}) returning id`;
  await sql`update projects set updated_at = now() where id = ${projectId}`;
  return String(row.id);
}

/* ------------------------------------------------------------------ */
/*  Admin                                                              */
/* ------------------------------------------------------------------ */

export async function allProjects() {
  const sql = await db();
  const rows = await sql<Row[]>`
    select p.*, coalesce(${sql.unsafe(AWAITING_TEAM)}, false) as awaiting_team
    from projects p order by updated_at desc limit 500`;
  return rows.map(toProject);
}

/**
 * Posts a team update: optionally moves the status and progress, records the
 * message, and returns the saved update for emailing to the client.
 */
export async function postTeamUpdate(
  projectId: string,
  change: {
    body: string;
    status: ProjectStatus | null;
    progress: number | null;
  },
) {
  const sql = await db();
  return sql.begin(async (tx) => {
    const [current] = await tx<{ status: ProjectStatus; progress: number }[]>`
      select status, progress from projects where id = ${projectId} for update`;
    if (!current) throw new Error("Project not found.");
    const status =
      change.status && change.status !== current.status ? change.status : null;
    const progress =
      change.progress !== null && change.progress !== current.progress
        ? change.progress
        : null;
    const [update] = await tx<{ id: string }[]>`
      insert into project_updates (project_id, author, body, status, progress)
      values (${projectId}, 'team', ${change.body}, ${status}, ${progress})
      returning id`;
    await tx`
      update projects set
        status = coalesce(${status}, status),
        progress = coalesce(${progress}, progress),
        updated_at = now()
      where id = ${projectId}`;
    return { id: String(update.id), body: change.body, status, progress };
  });
}

export async function markEmailed(updateId: string) {
  const sql = await db();
  await sql`update project_updates set emailed_at = now() where id = ${updateId}`;
}
