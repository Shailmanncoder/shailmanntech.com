import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/portal/Dashboard";
import { currentClient } from "@/lib/portal/auth";
import { projectsFor } from "@/lib/portal/projects";

export const metadata: Metadata = {
  title: "Your projects",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const client = await currentClient();
  if (!client) redirect("/login");
  return (
    <Dashboard
      name={client.name}
      email={client.email}
      projects={await projectsFor(client.email)}
      initialTab={(await searchParams).tab === "emails" ? "emails" : "projects"}
    />
  );
}
