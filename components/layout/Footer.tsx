import { products } from "@/lib/content";
import { mailto, navItems, site } from "@/lib/site";
import { Logo } from "@/components/ui/Logo";
import { UnderlineLink } from "@/components/ui/UnderlineLink";

type FooterLink = { label: string; href: string };

const columns: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Navigation",
    links: navItems.map((item) => ({ label: item.label, href: item.href })),
  },
  {
    heading: "Products",
    links: products.map((product) => ({
      label: product.name,
      href: `/products/${product.slug}`,
    })),
  },
  {
    heading: "Contact",
    links: [
      { label: site.email, href: mailto },
      { label: "Start a project", href: "/contact" },
      { label: "All services", href: "/services" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-canvas">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-brand-violet/40 to-transparent"
      />

      <div className="container-page relative py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-10">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-white/50">
              {site.blurb}
            </p>
            <a
              href={mailto}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 font-mono text-xs text-white/60 transition-colors duration-300 hover:border-white/20 hover:text-white"
            >
              {site.email}
            </a>
          </div>

          {columns.map((column) => (
            <nav
              key={column.heading}
              aria-labelledby={`footer-${column.heading}`}
            >
              <h2
                id={`footer-${column.heading}`}
                className="font-mono text-[0.625rem] tracking-[0.2em] text-white/40 uppercase"
              >
                {column.heading}
              </h2>
              <ul className="mt-5 flex flex-col gap-3.5">
                {column.links.map((link) => (
                  <li key={`${column.heading}-${link.label}`}>
                    <UnderlineLink
                      href={link.href}
                      className="text-[0.875rem] text-white/55"
                    >
                      {link.label}
                    </UnderlineLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/8 pt-8 sm:mt-16 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            &copy; {year} {site.name}. All rights reserved.
          </p>
          <p className="flex items-center gap-2 text-xs text-white/40">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-linear-to-r from-brand-cyan to-brand-violet"
            />
            Built with precision by {site.name}.
          </p>
        </div>
      </div>

      {/* oversized, low-contrast wordmark anchoring the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none relative -mb-4 flex justify-center overflow-hidden select-none sm:-mb-8 lg:-mb-12"
      >
        <span className="bg-linear-to-b from-white/[0.055] to-transparent bg-clip-text text-[14vw] leading-none font-semibold tracking-[-0.04em] whitespace-nowrap text-transparent">
          Shellman Tech
        </span>
      </div>
    </footer>
  );
}
