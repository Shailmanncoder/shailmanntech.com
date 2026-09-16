export const site = {
  name: "Shailmann Tech",
  shortName: "Shailmann",
  domain: "ShailmannTech.com",
  url: "https://shailmanntech.com",
  email: "support@ShailmannTech.com",
  tagline: "Building Modern Digital Products",
  description:
    "Shailmann Tech builds modern digital products and provides full-stack development, React, Next.js, DevOps, AWS, Docker, Linux, Git, and cloud engineering services.",
  blurb: "Building modern technology for the web and beyond.",
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
