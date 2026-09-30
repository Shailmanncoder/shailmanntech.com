import { adminRoute } from "@/lib/admin/api";
import { logEvent } from "@/lib/admin/audit";
import { exportAll } from "@/lib/admin/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cell(value: unknown) {
  let text = value instanceof Date ? value.toISOString() : String(value ?? "");
  // Stop spreadsheet apps from running a cell as a formula.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export const GET = adminRoute(async () => {
  const rows = await exportAll();
  await logEvent("export_downloaded", { details: { rows: rows.length } });
  const header = [
    "id",
    "received_at",
    "source",
    "name",
    "email",
    "subject",
    "status",
    "archived",
    "starred",
    "automated",
    "body",
  ];
  const lines = rows.map((row) =>
    [
      row.id,
      row.received_at,
      row.source,
      row.contact_name,
      row.contact_email,
      row.subject,
      row.status,
      row.archived,
      row.starred,
      row.automated,
      row.body,
    ]
      .map(cell)
      .join(","),
  );
  const csv = [header.join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="shailmann-inbox-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});
