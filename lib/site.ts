export const site = {
  name: "Shellman Tech",
  shortName: "Shellman",
  domain: "ShellmanTech.com",
  url: "https://ShellmanTech.com",
  email: "support@ShellmanTech.com",
  tagline: "Building Modern Digital Products",
  description:
    "Shellman Tech builds modern digital products and provides full-stack development, React, Next.js, DevOps, AWS, Docker, Linux, Git, and cloud engineering services.",
  blurb: "Building modern technology for the web and beyond.",
  twitter: "@shellmantech",
} as const;

export const mailto = `mailto:${site.email}`;

export type NavItem = {
  label: string;
  href: string;
  /** Section id this item tracks while the visitor is on the home page. */
  sectionId?: string;
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/", sectionId: "top" },
  { label: "Products", href: "/#products", sectionId: "products" },
  { label: "Services", href: "/#services", sectionId: "services" },
  { label: "Technology", href: "/#technology", sectionId: "technology" },
  { label: "About", href: "/#about", sectionId: "about" },
  { label: "Contact", href: "/contact" },
];
