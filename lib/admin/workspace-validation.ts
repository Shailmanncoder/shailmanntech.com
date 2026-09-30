export const LEAD_STAGES = [
  "new",
  "discussing",
  "proposal",
  "won",
  "lost",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];
export type ReplyAttachment = { filename: string; content: string };
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
export function validateAttachments(value: unknown): ReplyAttachment[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 5)
    throw new Error("Choose at most five attachments.");
  let total = 0;
  return value.map((item) => {
    if (
      !item ||
      typeof item.filename !== "string" ||
      typeof item.content !== "string"
    )
      throw new Error("Invalid attachment.");
    const filename = item.filename
      .replace(/[\\/\r\n\x00-\x1f]/g, "_")
      .slice(0, 180);
    if (
      !filename ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(item.content) ||
      item.content.length % 4 !== 0
    )
      throw new Error("Invalid attachment encoding.");
    const bytes = Buffer.from(item.content, "base64");
    total += bytes.length;
    if (!bytes.length || total > MAX_ATTACHMENT_BYTES)
      throw new Error("Attachments must total 2 MB or less.");
    return { filename, content: bytes.toString("base64") };
  });
}
export function validateLead(input: Record<string, unknown>) {
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid client email.");
  if (!LEAD_STAGES.includes(input.stage as LeadStage))
    throw new Error("Choose a valid lead stage.");
  const followUp = input.followUpAt ? new Date(String(input.followUpAt)) : null;
  if (followUp && !Number.isFinite(followUp.getTime()))
    throw new Error("Choose a valid follow-up date.");
  const clean = (v: unknown, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  const tags = [
    ...new Set(
      (Array.isArray(input.tags) ? input.tags : [])
        .map((t) => clean(t, 40))
        .filter(Boolean),
    ),
  ].slice(0, 12);
  return {
    email,
    stage: input.stage as LeadStage,
    name: clean(input.name, 120),
    notes: clean(input.notes, 10000),
    tags,
    followUpAt: followUp?.toISOString() ?? null,
  };
}
