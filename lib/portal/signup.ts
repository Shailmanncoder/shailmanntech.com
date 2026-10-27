import "server-only";
import { notify } from "@/lib/notifications";
import { notifyTeamOfSignup } from "./email";

/** A brand-new client account: email the team and ring the admin bell. */
export async function announceSignup(email: string, name: string, via: string) {
  await notifyTeamOfSignup({ email, name }, via);
  await notify(
    { audience: "admin" },
    {
      kind: "client_signup",
      title: `New client account: ${name || email}`,
      body: `${email} signed up with ${via}.`,
      link: "/admin?view=projects",
    },
  );
}
