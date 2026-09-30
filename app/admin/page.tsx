import { redirect } from "next/navigation";
import { aiConfigured } from "@/lib/admin/ai";
import { isAdmin } from "@/lib/admin/auth";
import { adminDbConfigured } from "@/lib/admin/db";
import { mailboxConfigured } from "@/lib/admin/mailbox";
import { AdminApp } from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <AdminApp
      setup={{
        database: adminDbConfigured(),
        mailbox: mailboxConfigured(),
        ai: aiConfigured(),
        email: Boolean(process.env.RESEND_API_KEY),
      }}
    />
  );
}
