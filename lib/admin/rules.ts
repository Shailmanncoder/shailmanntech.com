import "server-only";
import { services } from "@/lib/content";
import { db } from "./db";

/**
 * The owner's "project rules": what the studio takes on and what it turns
 * down. The AI checks every request against these before drafting a reply.
 * They start from the services on the website and are edited in the admin.
 */

export type ProjectRules = {
  /** Kinds of work the studio takes on. */
  takes: string;
  /** Kinds of work the studio turns down. */
  declines: string;
  /** Smallest budget worth taking on, in the owner's words ("$2,000"). */
  minimumBudget: string;
  /** Current capacity, e.g. "Booked until 15 November". */
  availability: string;
  /** Anything else the AI should know when replying. */
  notes: string;
};

const KEY = "project_rules";

export function defaultRules(): ProjectRules {
  return {
    takes: services
      .map((s) => `- ${s.title}: ${s.description} (${s.tech.join(", ")})`)
      .join("\n"),
    declines: "",
    minimumBudget: "",
    availability: "",
    notes: "",
  };
}

export async function getRules(): Promise<
  ProjectRules & { updatedAt: string | null }
> {
  const sql = await db();
  const [row] = await sql<{ value: Partial<ProjectRules>; updated_at: Date }[]>`
    select value, updated_at from admin_settings where key = ${KEY}`;
  return {
    ...defaultRules(),
    ...(row?.value ?? {}),
    updatedAt: row ? row.updated_at.toISOString() : null,
  };
}

const LIMIT = 4000;

export async function saveRules(
  input: Partial<Record<keyof ProjectRules, unknown>>,
) {
  const clean = (value: unknown) =>
    typeof value === "string" ? value.trim().slice(0, LIMIT) : "";
  const rules: ProjectRules = {
    takes: clean(input.takes),
    declines: clean(input.declines),
    minimumBudget: clean(input.minimumBudget),
    availability: clean(input.availability),
    notes: clean(input.notes),
  };
  const sql = await db();
  await sql`
    insert into admin_settings (key, value, updated_at)
    values (${KEY}, ${sql.json(rules)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  return getRules();
}
