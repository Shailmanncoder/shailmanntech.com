import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/portal/AuthForm";
import { currentClient } from "@/lib/portal/auth";
import { googleConfigured } from "@/lib/portal/google";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a Shailmann Tech client account to follow your projects.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await currentClient()) redirect("/dashboard");
  return (
    <section className="flex min-h-[80svh] items-center justify-center px-4 pt-28 pb-16">
      <AuthForm initialMode="signup" googleEnabled={googleConfigured()} />
    </section>
  );
}
