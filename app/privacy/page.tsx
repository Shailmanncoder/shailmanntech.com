import type { Metadata } from "next";
import { A, H2, LegalPage, List, P } from "@/components/legal/LegalPage";
import { mailto, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses and protects your information.`,
  alternates: { canonical: "/privacy" },
};

const UPDATED = "12 October 2026";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated={UPDATED}
      intro={`What ${site.name} collects when you use ${site.domain}, why, who helps us process it, and the choices you have.`}
    >
      <P>
        {site.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs {site.domain},
        including the contact form and the client portal. This policy explains
        how we handle personal information. For questions or requests, email{" "}
        <A href={mailto}>{site.email}</A>.
      </P>

      <H2 id="collect">What we collect</H2>
      <List>
        <li>
          <strong className="text-white">Project requests</strong> you send
          through the contact form or the client portal: your name, email
          address, company, the service you need, your project description and
          budget range.
        </li>
        <li>
          <strong className="text-white">Client account details</strong> if you
          sign up: your name, email address and a password. We never store your
          password itself, only a secure, one-way scrambled version (a hash).
        </li>
        <li>
          <strong className="text-white">Google sign-in</strong>, if you choose
          &ldquo;Continue with Google&rdquo;: Google shares your name, email
          address and an account identifier with us. We don&rsquo;t receive your
          Google password or access to anything else in your Google account.
        </li>
        <li>
          <strong className="text-white">Messages and project updates</strong>{" "}
          you exchange with us by email or in the client portal.
        </li>
        <li>
          <strong className="text-white">Technical information</strong> needed
          to keep the site secure and working: your IP address (used briefly to
          limit repeated sign-in attempts and spam) and the cookies described
          below.
        </li>
      </List>

      <H2 id="use">How we use it</H2>
      <List>
        <li>
          To reply to your request, discuss and deliver your project, and send
          project updates.
        </li>
        <li>
          To create and secure your client account, including emailing one-time
          sign-in codes.
        </li>
        <li>
          To prioritise new requests: we use an AI service to summarise
          requests, check whether a project fits the work we take on, and draft
          replies. A person at {site.name} reviews replies before they&rsquo;re
          sent, and the AI never makes decisions about you on its own.
        </li>
        <li>
          To protect the site against spam, abuse and unauthorised access.
        </li>
      </List>
      <P>
        We don&rsquo;t sell your information, use it for advertising, or share
        it with anyone except the service providers below, or where the law
        requires it.
      </P>

      <H2 id="providers">Service providers we use</H2>
      <P>
        These companies process information on our behalf, only to provide their
        service to us:
      </P>
      <List>
        <li>
          <strong className="text-white">Vercel</strong> — hosts the website.
        </li>
        <li>
          <strong className="text-white">Neon</strong> — stores our database
          (requests, accounts, projects and messages).
        </li>
        <li>
          <strong className="text-white">Resend</strong> — sends our emails,
          such as confirmations, sign-in codes and project updates.
        </li>
        <li>
          <strong className="text-white">GoDaddy</strong> — hosts our{" "}
          {site.email} mailbox.
        </li>
        <li>
          <strong className="text-white">OpenAI</strong> — the AI service that
          summarises requests and drafts replies, as described above.
        </li>
        <li>
          <strong className="text-white">Cloudflare Turnstile</strong> — checks
          that form submissions come from people, not bots.
        </li>
        <li>
          <strong className="text-white">Telegram</strong> — notifies our team
          about new requests (your name, email and a short summary).
        </li>
        <li>
          <strong className="text-white">Google</strong> — only if you use
          &ldquo;Continue with Google&rdquo;.
        </li>
        <li>
          <strong className="text-white">Cal.com</strong> — if you book a call
          with us, booking happens on Cal.com and is covered by{" "}
          <A href="https://cal.com/privacy">Cal.com&rsquo;s privacy policy</A>.
        </li>
      </List>
      <P>
        Some of these providers process data outside India, including in the
        United States.
      </P>

      <H2 id="cookies">Cookies</H2>
      <P>
        We only use cookies the site needs to work. We don&rsquo;t use
        advertising or tracking cookies.
      </P>
      <List>
        <li>
          <strong className="text-white">Sign-in cookie</strong> — keeps you
          signed in to the client portal for up to 30 days, or until you sign
          out.
        </li>
        <li>
          <strong className="text-white">Google sign-in cookie</strong> — a
          temporary cookie that secures the &ldquo;Continue with Google&rdquo;
          step and expires within 10 minutes.
        </li>
        <li>
          <strong className="text-white">Cloudflare Turnstile</strong> may set
          cookies to tell people and bots apart.
        </li>
      </List>

      <H2 id="retention">How long we keep it</H2>
      <P>
        We keep project requests, messages and account details for as long as
        we&rsquo;re working together and for a reasonable time afterwards for
        our records, or longer where the law requires it (for example, for
        invoices and tax). Sign-in codes expire after 10 minutes, and records
        used to limit repeated attempts are deleted within a day. You can ask us
        to delete your information at any time.
      </P>

      <H2 id="security">How we protect it</H2>
      <P>
        Information travels over encrypted connections (HTTPS). Passwords are
        stored only as secure hashes, sign-in codes and session tokens are
        stored scrambled, and access to our systems is limited to the{" "}
        {site.name} team. No system is perfectly secure, but we work to protect
        your information and will tell you promptly if a breach affects you.
      </P>

      <H2 id="rights">Your choices and rights</H2>
      <P>
        You can ask us to show you the information we hold about you, correct
        it, delete it or your account, or stop using it for a particular
        purpose. Email <A href={mailto}>{site.email}</A> from the address you
        use with us, and we&rsquo;ll respond within 30 days. You can also
        complain to the data protection authority where you live.
      </P>

      <H2 id="children">Children</H2>
      <P>
        Our services are for businesses and adults. We don&rsquo;t knowingly
        collect information from anyone under 18.
      </P>

      <H2 id="changes">Changes to this policy</H2>
      <P>
        If we change how we handle your information, we&rsquo;ll update this
        page and its date, and tell clients with an account about significant
        changes by email.
      </P>

      <H2 id="contact">Contact</H2>
      <P>
        {site.name} · <A href={mailto}>{site.email}</A> ·{" "}
        <A href={site.url}>{site.domain}</A>
      </P>
    </LegalPage>
  );
}
