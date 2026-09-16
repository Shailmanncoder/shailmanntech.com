import {
  Atom,
  Blocks,
  Cloud,
  Container,
  Database,
  GitBranch,
  Infinity as InfinityIcon,
  Layers,
  Network,
  Terminal,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Products                                                           */
/* ------------------------------------------------------------------ */

export type Product = {
  slug: string;
  index: string;
  name: string;
  /** One-line positioning used in cards, footers and meta descriptions. */
  kicker: string;
  description: string;
  /** Longer copy shown on the dedicated product route. */
  longDescription: string;
  url: string;
  /** Domain shown in the browser-chrome mockup. */
  display: string;
  cta: string;
  tech: string[];
  highlights: { title: string; body: string }[];
  /** Tailwind gradient stops driving each product's accent. */
  accent: { from: string; to: string; glow: string };
};

export const products: Product[] = [
  {
    slug: "nexusmate",
    index: "01",
    name: "NexusMate",
    kicker: "Connected productivity",
    // NOTE(content): placeholder copy — swap for the final NexusMate positioning.
    description:
      "A productivity-focused platform built around connected workflows, keeping the tools, context and people behind a project in one coherent space.",
    longDescription:
      "NexusMate is a Shellman Tech product exploring how modern productivity software should feel: fast, uncluttered, and aware of the context you are working in. The platform is built on the same engineering foundations we bring to client work — a typed codebase, server-rendered performance, and infrastructure that scales without ceremony.",
    url: "https://nexusmate.live",
    display: "nexusmate.live",
    cta: "Visit NexusMate",
    tech: ["Next.js", "React", "TypeScript", "Node.js", "Tailwind CSS"],
    highlights: [
      {
        title: "Built for flow",
        body: "Interface decisions are made in service of momentum — fewer screens, fewer clicks, less waiting.",
      },
      {
        title: "Typed end to end",
        body: "A single TypeScript contract runs from the database layer through the API to the interface.",
      },
      {
        title: "Fast by default",
        body: "Server rendering, streaming and aggressive caching keep interactions under the perception threshold.",
      },
    ],
    accent: {
      from: "from-brand-cyan",
      to: "to-brand-blue",
      glow: "rgba(34,211,238,0.28)",
    },
  },
  {
    slug: "learnonline",
    index: "02",
    name: "LearnOnline",
    kicker: "Education platform",
    description:
      "An education-focused digital platform designed to make online learning simpler, accessible, and more engaging.",
    longDescription:
      "LearnOnline approaches online education as an interface problem as much as a content problem. The platform is designed so that learners spend their attention on the material rather than on navigation — clear structure, readable typography, predictable progress, and a delivery layer built to stay responsive on modest connections and modest hardware.",
    url: "https://learnonline.study",
    display: "learnonline.study",
    cta: "Explore LearnOnline",
    tech: ["Next.js", "React", "TypeScript", "REST APIs", "Databases"],
    highlights: [
      {
        title: "Accessible by design",
        body: "Semantic structure, keyboard paths and contrast are treated as requirements, not refinements.",
      },
      {
        title: "Content first",
        body: "A reading-optimised type system keeps long-form learning material comfortable at any length.",
      },
      {
        title: "Resilient delivery",
        body: "Static generation with incremental updates keeps the platform quick on slower networks.",
      },
    ],
    accent: {
      from: "from-brand-violet",
      to: "to-brand-indigo",
      glow: "rgba(139,92,246,0.28)",
    },
  },
  {
    slug: "ai-career-os",
    index: "03",
    name: "AI Career OS",
    kicker: "AI career platform",
    description:
      "An AI-powered career platform designed to help users navigate career decisions, opportunities, skills, and professional growth.",
    longDescription:
      "AI Career OS applies modern model tooling to a genuinely difficult problem: making sense of a career in motion. The product is built as a system rather than a chat window — structured inputs, reasoned outputs, and an interface that keeps the person in control of the decision while the model handles the breadth.",
    url: "https://aicareeros.vercel.app",
    display: "aicareeros.vercel.app",
    cta: "Launch AI Career OS",
    tech: ["Next.js", "React", "TypeScript", "Node.js", "Vercel"],
    highlights: [
      {
        title: "Structured intelligence",
        body: "Model output is shaped into reviewable structure instead of free-floating text.",
      },
      {
        title: "Person in the loop",
        body: "Every suggestion stays inspectable, so the decision belongs to the user.",
      },
      {
        title: "Edge-deployed",
        body: "Running close to the user keeps generation responsive wherever the session starts.",
      },
    ],
    accent: {
      from: "from-brand-blue",
      to: "to-brand-violet",
      glow: "rgba(99,102,241,0.28)",
    },
  },
];

export const getProduct = (slug: string) =>
  products.find((product) => product.slug === slug);

/* ------------------------------------------------------------------ */
/*  Services                                                           */
/* ------------------------------------------------------------------ */

export type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
  tech: string[];
};

export const services: Service[] = [
  {
    title: "Full-Stack Development",
    description:
      "Modern scalable web applications built from frontend to backend.",
    icon: Layers,
    tech: ["React", "Next.js", "TypeScript", "Node.js"],
  },
  {
    title: "React Development",
    description:
      "Fast, reusable, maintainable React interfaces and applications.",
    icon: Atom,
    tech: ["React", "Hooks", "State", "Components"],
  },
  {
    title: "Next.js Development",
    description:
      "High-performance production applications using modern Next.js architecture.",
    icon: Blocks,
    tech: ["App Router", "SSR", "ISR", "Edge"],
  },
  {
    title: "DevOps",
    description:
      "Reliable deployment pipelines, infrastructure automation, monitoring, and production workflows.",
    icon: InfinityIcon,
    tech: ["CI/CD", "Automation", "Monitoring", "Releases"],
  },
  {
    title: "AWS",
    description:
      "Cloud architecture, deployment, infrastructure, storage, compute, and scalable solutions.",
    icon: Cloud,
    tech: ["EC2", "S3", "Lambda", "IAM"],
  },
  {
    title: "Docker",
    description: "Containerized development and production environments.",
    icon: Container,
    tech: ["Images", "Compose", "Registries", "Runtimes"],
  },
  {
    title: "Linux",
    description:
      "Linux server configuration, deployment, optimization, and administration.",
    icon: Terminal,
    tech: ["Shell", "systemd", "Nginx", "Hardening"],
  },
  {
    title: "Git & GitHub",
    description:
      "Modern source control workflows, repository management, branching strategies, and CI/CD integration.",
    icon: GitBranch,
    tech: ["Branching", "Reviews", "Actions", "Releases"],
  },
  {
    title: "Cloud Infrastructure",
    description: "Scalable infrastructure designed for modern applications.",
    icon: Network,
    tech: ["Networking", "Scaling", "Storage", "Compute"],
  },
  {
    title: "API & Backend Development",
    description:
      "Secure and scalable APIs, backend systems, integrations, and databases.",
    icon: Database,
    tech: ["REST", "Auth", "Databases", "Integrations"],
  },
];

/** Options offered by the contact form's "Service Needed" field. */
export const serviceOptions = [
  ...services.map((service) => service.title),
  "Product Development",
  "Something else",
];

/* ------------------------------------------------------------------ */
/*  Technology                                                         */
/* ------------------------------------------------------------------ */

export type TechKey =
  | "nextjs"
  | "react"
  | "typescript"
  | "javascript"
  | "nodejs"
  | "aws"
  | "docker"
  | "linux"
  | "git"
  | "github"
  | "html"
  | "css"
  | "tailwind"
  | "rest"
  | "database"
  | "vercel";

export type Tech = { key: TechKey; name: string; category: string };

export const technologies: Tech[] = [
  { key: "nextjs", name: "Next.js", category: "Framework" },
  { key: "react", name: "React", category: "Library" },
  { key: "typescript", name: "TypeScript", category: "Language" },
  { key: "javascript", name: "JavaScript", category: "Language" },
  { key: "nodejs", name: "Node.js", category: "Runtime" },
  { key: "aws", name: "AWS", category: "Cloud" },
  { key: "docker", name: "Docker", category: "Containers" },
  { key: "linux", name: "Linux", category: "Systems" },
  { key: "git", name: "Git", category: "Version control" },
  { key: "github", name: "GitHub", category: "Collaboration" },
  { key: "html", name: "HTML", category: "Web" },
  { key: "css", name: "CSS", category: "Web" },
  { key: "tailwind", name: "Tailwind CSS", category: "Styling" },
  { key: "rest", name: "REST APIs", category: "Interfaces" },
  { key: "database", name: "Databases", category: "Data" },
  { key: "vercel", name: "Vercel", category: "Platform" },
];

/** Short strip shown under the hero CTAs. */
export const heroTech = [
  "Next.js",
  "React",
  "AWS",
  "Docker",
  "Linux",
  "Git",
  "TypeScript",
  "Node.js",
];

/* ------------------------------------------------------------------ */
/*  Philosophy                                                         */
/* ------------------------------------------------------------------ */

export type Principle = { index: string; title: string; body: string };

export const principles: Principle[] = [
  {
    index: "01",
    title: "Performance First",
    body: "Speed is a feature the user feels before they read a single word. We budget for it from the first commit — rendering strategy, payload size and interaction latency are design decisions, not clean-up work.",
  },
  {
    index: "02",
    title: "Built to Scale",
    body: "Architecture is chosen for the version of the product that exists in two years. Clear boundaries, typed contracts and infrastructure that grows without a rewrite.",
  },
  {
    index: "03",
    title: "Thoughtful Design",
    body: "Interfaces earn their complexity. Every element has a reason to exist, hierarchy is deliberate, and motion is used to explain rather than decorate.",
  },
  {
    index: "04",
    title: "Reliable Engineering",
    body: "Production is the only environment that counts. Automated pipelines, reproducible environments and observability mean shipping is routine instead of risky.",
  },
];

/* ------------------------------------------------------------------ */
/*  Process                                                            */
/* ------------------------------------------------------------------ */

export type ProcessStep = {
  index: string;
  title: string;
  description: string;
  detail: string;
};

export const processSteps: ProcessStep[] = [
  {
    index: "01",
    title: "Discover",
    description:
      "Understand the idea, requirements, audience, and technical challenges.",
    detail:
      "We map what the product actually needs to do, who it serves, and where the hard constraints sit — before a line of code is written.",
  },
  {
    index: "02",
    title: "Design",
    description:
      "Define architecture, user experience, interfaces, and system structure.",
    detail:
      "Data models, service boundaries and interface flows are settled together, so the system and the experience are shaped by the same decisions.",
  },
  {
    index: "03",
    title: "Build",
    description: "Develop the product using modern engineering practices.",
    detail:
      "Typed, reviewed, incremental delivery. Working software lands early and keeps landing, with quality gates running on every change.",
  },
  {
    index: "04",
    title: "Ship",
    description: "Deploy secure, optimized production infrastructure.",
    detail:
      "Automated pipelines, containerised environments and cloud infrastructure take the product from a branch to production predictably.",
  },
  {
    index: "05",
    title: "Improve",
    description: "Monitor, iterate, optimize, and scale.",
    detail:
      "Real usage drives the next iteration — monitoring, performance work and capacity planning keep the product healthy as it grows.",
  },
];

/* ------------------------------------------------------------------ */
/*  Stats                                                              */
/* ------------------------------------------------------------------ */

export type Stat = {
  /** Numeric value drives the count-up; omit for text-only stats. */
  value?: number;
  suffix?: string;
  display?: string;
  label: string;
};

export const stats: Stat[] = [
  { value: 3, suffix: "+", label: "Products Built" },
  { value: 10, suffix: "+", label: "Technologies" },
  { display: "Full Stack", label: "Engineering" },
  { display: "Cloud Ready", label: "Infrastructure" },
];
