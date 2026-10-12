import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/portal/AuthForm";
import { currentClient } from "@/lib/portal/auth";
import { googleConfigured } from "@/lib/portal/google";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to the Shailmann Tech client portal.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentClient()) redirect("/dashboard");
  const { error } = await searchParams;
  return (
    <section className="flex min-h-[80svh] items-center justify-center px-4 pt-28 pb-16">
      <AuthForm
        initialMode="login"
        googleEnabled={googleConfigured()}
        errorCode={error}
      />
    </section>
  );
}
