import type { Metadata } from "next";
import { Clock, Mail, MapPin } from "lucide-react";
import { mailto, site } from "@/lib/site";
import { breadcrumbSchema, jsonLd } from "@/lib/structured-data";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/forms/ContactForm";
import { products } from "@/lib/content";
import { UnderlineLink } from "@/components/ui/UnderlineLink";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start a project with Shellman Tech. Tell us what you're building and we'll map the engineering it needs.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact — ${site.name}`,
    description:
      "Tell us what you're building and we'll map the engineering it needs.",
    url: `${site.url}/contact`,
  },
};

const details = [
  {
    icon: Mail,
    label: "Email",
    value: site.email,
    href: mailto,
  },
  {
    icon: Clock,
    label: "Response time",
    value: "We read every request and reply personally.",
  },
  {
    icon: MapPin,
    label: "Working",
    value: "Remote-first, across time zones.",
  },
];

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Contact", path: "/contact" },
            ]),
          ),
        }}
      />

      <PageHero
        eyebrow="Contact"
        title={
          <>
            Tell us what you&rsquo;re building.
            <span className="block text-gradient">
              We&rsquo;ll take it from there.
            </span>
          </>
        }
        description="Share a little about the project — the stage it's at, what it needs to do, and where you'd like help. We'll come back with how Shellman Tech would approach it."
      />

      <Section
        divider
        className="pb-16 sm:pb-20 lg:pb-24"
        aria-labelledby="contact-form-heading"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-16 xl:gap-20">
          {/* ---------- details ---------- */}
          <div className="min-w-0">
            <Reveal>
              <h2
                id="contact-form-heading"
                className="text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl"
              >
                Start a project
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/60">
                Every request goes straight to the people who would do the work
                — no forms disappearing into a queue.
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <ul className="mt-10 flex flex-col gap-6">
                {details.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-brand-cyan">
                      <Icon
                        aria-hidden="true"
                        className="size-4.5"
                        strokeWidth={1.6}
                      />
                    </span>
                    <span className="min-w-0 pt-1">
                      <span className="block font-mono text-[0.625rem] tracking-[0.18em] text-white/40 uppercase">
                        {label}
                      </span>
                      <span className="mt-1.5 block text-sm text-white/70">
                        {href ? (
                          <UnderlineLink
                            href={href}
                            className="text-sm text-white/80"
                          >
                            {value}
                          </UnderlineLink>
                        ) : (
                          value
                        )}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.02] p-6">
                <p className="font-mono text-[0.625rem] tracking-[0.18em] text-white/40 uppercase">
                  Our products
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {products.map((product) => (
                    <li key={product.slug}>
                      <UnderlineLink
                        href={`/products/${product.slug}`}
                        className="text-sm text-white/60"
                      >
                        {product.name}
                      </UnderlineLink>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* ---------- form ---------- */}
          <Reveal delay={0.1} y={26} className="min-w-0">
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(55%_45%_at_50%_0%,rgba(99,102,241,0.18),transparent_70%)] blur-2xl"
              />
              <div className="rounded-2xl border border-white/10 bg-white/[0.022] p-6 sm:p-8 lg:p-10">
                <ContactForm />
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
