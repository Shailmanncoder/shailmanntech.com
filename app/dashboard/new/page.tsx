import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewProjectForm } from "@/components/portal/NewProjectForm";
import { serviceOptions } from "@/lib/content";
import { currentClient } from "@/lib/portal/auth";

export const metadata: Metadata = {
  title: "New project",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  if (!(await currentClient())) redirect("/login");
  return <NewProjectForm services={serviceOptions} />;
}
