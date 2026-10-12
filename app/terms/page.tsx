import type { Metadata } from "next";
import { A, H2, LegalPage, List, P } from "@/components/legal/LegalPage";
import { mailto, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms for using ${site.domain} and the ${site.name} client portal.`,
  alternates: { canonical: "/terms" },
};

const UPDATED = "12 October 2026";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated={UPDATED}
      intro={`The rules for using ${site.domain}, the contact form and the ${site.name} client portal.`}
    >
      <P>
        These terms apply when you use {site.domain}, including the contact form
        and the client portal. By using the site or creating an account, you
        agree to them. If you don&rsquo;t agree, please don&rsquo;t use the
        site.
      </P>

      <H2 id="projects">Project requests and engagements</H2>
      <P>
        Sending a project request, through the contact form or the client
        portal, is an enquiry, not a contract. We may decline any request. Any
        project we take on is governed by a separate written proposal or
        agreement that sets out the scope, price, timeline and other terms. If
        that agreement conflicts with these terms, the agreement wins.
      </P>

      <H2 id="accounts">Your client account</H2>
      <List>
        <li>
          Give accurate information and keep your email address up to date.
        </li>
        <li>
          Keep your password private. You&rsquo;re responsible for activity on
          your account; tell us straight away at{" "}
          <A href={mailto}>{site.email}</A> if you think someone else has used
          it.
        </li>
        <li>
          One account per person. Accounts are for clients and prospective
          clients of {site.name}.
        </li>
        <li>
          We may suspend or close an account that breaks these terms, and you
          can ask us to close yours at any time.
        </li>
      </List>

      <H2 id="use">Acceptable use</H2>
      <P>Please don&rsquo;t:</P>
      <List>
        <li>send spam, malware or anything unlawful, harmful or abusive;</li>
        <li>
          try to access other people&rsquo;s accounts or data, or areas of the
          site you aren&rsquo;t allowed into;
        </li>
        <li>
          overload, probe or attack the site, or get around its security or bot
          protection;
        </li>
        <li>use automated tools to scrape the site or create accounts.</li>
      </List>

      <H2 id="content">Content and intellectual property</H2>
      <P>
        The site&rsquo;s design, text, graphics and code belong to {site.name}.
        You keep ownership of the information and files you send us, and allow
        us to use them to respond to you and work on your project. Ownership of
        work we deliver is set out in each project&rsquo;s agreement.
      </P>

      <H2 id="ai">AI-assisted replies</H2>
      <P>
        We use AI tools to help summarise requests and draft replies. Everything
        we send is reviewed by a person, but information on the site and in
        automated emails is general and isn&rsquo;t a binding offer; only a
        signed proposal or agreement is.
      </P>

      <H2 id="third-party">Other services</H2>
      <P>
        Some features rely on other providers, such as Google for
        &ldquo;Continue with Google&rdquo; and Cal.com for booking calls. Their
        own terms apply when you use them, and we aren&rsquo;t responsible for
        their services.
      </P>

      <H2 id="liability">Disclaimers and liability</H2>
      <P>
        We work to keep the site accurate and available, but it&rsquo;s provided
        &ldquo;as is&rdquo;, without guarantees that it will always be available
        or error-free. To the extent the law allows, {site.name} isn&rsquo;t
        liable for indirect or consequential losses from using the site, and our
        total liability relating to the site is limited to ₹10,000. Nothing in
        these terms limits rights you have by law that can&rsquo;t be excluded.
      </P>

      <H2 id="privacy">Privacy</H2>
      <P>
        How we handle your information is described in our{" "}
        <A href="/privacy">Privacy Policy</A>.
      </P>

      <H2 id="changes">Changes</H2>
      <P>
        We may update these terms. We&rsquo;ll change the date above and tell
        account holders about significant changes by email. Continuing to use
        the site after that means you accept the updated terms.
      </P>

      <H2 id="law">Governing law</H2>
      <P>
        These terms are governed by the laws of India, and disputes are subject
        to the courts of India.
      </P>

      <H2 id="contact">Contact</H2>
      <P>
        {site.name} · <A href={mailto}>{site.email}</A> ·{" "}
        <A href={site.url}>{site.domain}</A>
      </P>
    </LegalPage>
  );
}
