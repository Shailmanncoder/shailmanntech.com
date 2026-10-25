import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ActionButton } from "@/components/ui/ActionButton";
import { site } from "@/lib/site";
import { breadcrumbSchema, founderProfileSchema, jsonLd } from "@/lib/structured-data";

const title = "Shailmann — Founder of Shailmann Tech";
const description = founderProfileSchema.mainEntity.description;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/founder" },
  openGraph: { title, description, url: `${site.url}/founder`, type: "profile", siteName: site.name, images: [{ url: founderProfileSchema.mainEntity.image, width: 1145, height: 1374, alt: "Shailmann, founder of Shailmann Tech" }] },
  twitter: { card: "summary_large_image", title, description, images: [{ url: founderProfileSchema.mainEntity.image, alt: "Shailmann, founder of Shailmann Tech" }] },
};

export default function FounderPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([
        founderProfileSchema,
        breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Founder", path: "/founder" }]),
      ]) }} />
      <section className="relative overflow-hidden border-b border-white/10 pt-32 pb-20 sm:pt-44 sm:pb-28" aria-labelledby="founder-heading">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(99,102,241,0.16),transparent_60%)]" />
        <div className="container-page relative">
          <nav aria-label="Breadcrumb" className="mb-12 flex gap-3 text-sm text-white/60">
            <Link href="/" className="hover:text-white">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Founder</span>
          </nav>
          <div className="grid items-center gap-14 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
            <div>
              <p className="font-mono text-xs tracking-[0.22em] text-brand-cyan uppercase">The person behind the studio</p>
              <h1 id="founder-heading" className="mt-6 text-5xl leading-[1.05] font-semibold tracking-[-0.05em] sm:text-7xl lg:text-8xl">Shailmann<span className="text-brand-cyan">.</span></h1>
              <p className="mt-5 text-xl text-white/85 sm:text-2xl">Founder of Shailmann Tech</p>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/65">{description}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ActionButton href="/products" arrow="right">Explore the studio’s work</ActionButton>
                <ActionButton href="/contact" variant="secondary">Get in touch</ActionButton>
              </div>
            </div>
            <figure className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-linear-to-br from-brand-indigo/15 via-surface to-canvas-raised p-8 sm:p-10">
              <Image
                src="/images/shailmann-founder.jpeg"
                alt="Shailmann, founder of Shailmann Tech"
                width={1145}
                height={1374}
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 560px, 100vw"
                preload
                className="relative h-auto w-full rounded-2xl"
              />
              <figcaption className="relative mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-6">
                <div><p className="text-lg font-medium">Shailmann</p><p className="mt-1 text-sm text-white/60">Founder · Shailmann Tech</p></div>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>
      <section className="container-page py-20 sm:py-28" aria-labelledby="bio-heading">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-20">
          <div><p className="font-mono text-xs tracking-widest text-brand-cyan uppercase">About Shailmann</p><h2 id="bio-heading" className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">A founder.<br />A technology studio.</h2></div>
          <div className="space-y-6 text-lg leading-relaxed text-white/70">
            <p>Shailmann founded Shailmann Tech. The studio brings together digital product development and engineering services, with work spanning web applications, cloud infrastructure, and DevOps.</p>
            <p>This website is home to the studio’s products, services, and approach to building software. Explore the portfolio to learn about the work, or contact Shailmann Tech to discuss a project.</p>
            <div className="grid gap-4 pt-4 sm:grid-cols-2">
              {[{ href: "/about", label: "The studio", text: "Get to know Shailmann Tech" }, { href: "/services", label: "Engineering services", text: "Explore what the studio builds" }].map((item) => (
                <Link key={item.href} href={item.href} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition-colors hover:border-brand-cyan/40 hover:bg-white/[0.05]">
                  <h3 className="text-base font-medium text-white">{item.label} <span aria-hidden="true" className="text-brand-cyan">↗</span></h3>
                  <p className="mt-2 text-sm text-white/60">{item.text}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
