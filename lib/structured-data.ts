import { products, services } from "./content";
import { site } from "./site";

const logo = `${site.url}/icon.svg`;

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${site.url}/#organization`,
  name: site.name,
  alternateName: "ShellmanTech",
  url: site.url,
  logo,
  image: logo,
  description: site.description,
  email: site.email,
  slogan: "Building modern technology for the web and beyond.",
  knowsAbout: services.map((service) => service.title),
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: site.email,
      availableLanguage: ["English"],
    },
  ],
} as const;

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  url: site.url,
  name: site.name,
  description: site.description,
  inLanguage: "en",
  publisher: { "@id": `${site.url}/#organization` },
} as const;

export const professionalServiceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${site.url}/services#service`,
  name: `${site.name} — Engineering Services`,
  url: `${site.url}/services`,
  provider: { "@id": `${site.url}/#organization` },
  description:
    "Full-stack development, React and Next.js engineering, DevOps, AWS, Docker, Linux, Git and cloud infrastructure services.",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Engineering services",
    itemListElement: services.map((service, index) => ({
      "@type": "Offer",
      position: index + 1,
      itemOffered: {
        "@type": "Service",
        name: service.title,
        description: service.description,
      },
    })),
  },
} as const;

export const productListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": `${site.url}/#products`,
  name: `${site.name} products`,
  itemListElement: products.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: product.name,
    url: `${site.url}/products/${product.slug}`,
  })),
} as const;

export function productSchema(slug: string) {
  const product = products.find((item) => item.slug === slug);
  if (!product) return null;

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    url: product.url,
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
    description: product.description,
    author: { "@id": `${site.url}/#organization` },
    publisher: { "@id": `${site.url}/#organization` },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${site.url}${crumb.path}`,
    })),
  };
}

/** Serialises schema objects for a single <script type="application/ld+json">. */
export const jsonLd = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
