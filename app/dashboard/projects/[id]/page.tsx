import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProjectView } from "@/components/portal/ProjectView";
import { currentClient } from "@/lib/portal/auth";
import { getProject } from "@/lib/portal/projects";

export const metadata: Metadata = {
  title: "Project",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const client = await currentClient();
  if (!client) redirect("/login");
  const found = await getProject((await params).id, client.email);
  if (!found) notFound();
  // Keyed by the latest change, so a refresh shows new updates.
  return (
    <ProjectView
      key={`${found.project.updatedAt}-${found.updates.length}`}
      initial={found}
    />
  );
}
