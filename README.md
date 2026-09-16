# Shailmann Tech

The marketing and portfolio site for **Shailmann Tech** — a technology studio building
modern digital products and providing full-stack, cloud and DevOps engineering.

Live domain: <https://ShailmannTech.com> · Support: <support@ShailmannTech.com>

## Stack

| Concern    | Choice                                 |
| ---------- | -------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)     |
| UI         | React 19 · TypeScript 5                |
| Styling    | Tailwind CSS 4 (CSS-first `@theme`)    |
| Motion     | Framer Motion 13                       |
| Icons      | lucide-react + an in-house SVG tech set |
| Hosting    | Optimised for Vercel                   |

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Development server                    |
| `npm run build`     | Production build                      |
| `npm run start`     | Serve the production build            |
| `npm run lint`      | ESLint (Next + React Compiler rules)  |
| `npm run typecheck` | `tsc --noEmit`                        |

## Editing content

Copy and data are kept out of the components so the site can be updated without
touching layout code:

- **`lib/site.ts`** — company name, domain, support email, navigation items.
- **`lib/content.ts`** — products, services, technologies, principles, process
  steps and stats. Adding a service or a technology is a single array entry.
- **`lib/structured-data.ts`** — schema.org payloads, derived from the above.

Adding a product to `products` in `lib/content.ts` automatically creates its
`/products/<slug>` route, its Open Graph image, its sitemap entry and its footer
link. Give it a visual in `components/sections/Products.tsx` (`visualFor`), which
maps each slug to its own mockup so no two products look alike.

### Product screenshots

Each product shows a hand-built abstract mockup by default. To show a real
screenshot instead, capture one and point the product's `screenshot` field at it:

```bash
npm run capture -- nexusmeet https://nexusmeet.live
```

That writes `public/products/nexusmeet.png` at 2880x1980 (16:11, matching the
showcase frame). Then in `lib/content.ts`:

```ts
screenshot: { src: "/products/nexusmeet.png", alt: "The NexusMeet dashboard" },
```

The showcase and the product route both pick it up automatically and render it
inside the same browser chrome the mockups use. Remove the field to fall back to
the mockup. Any image works — the capture script is a convenience, not a
requirement, so a hand-supplied PNG dropped in `public/products/` is fine.

> The NexusMeet description is intentionally a placeholder — it is marked with a
> `NOTE(content)` comment in `lib/content.ts`.

## Contact form

The form posts to `/api/contact`. Validation is shared between the browser and
the server (`lib/contact.ts`), and delivery is isolated in
`lib/contact-delivery.ts` so connecting a provider is configuration, not code:

```bash
cp .env.example .env.local
```

| Variable              | Effect                                             |
| --------------------- | -------------------------------------------------- |
| `CONTACT_WEBHOOK_URL` | POSTs the submission as JSON to any endpoint        |
| `RESEND_API_KEY`      | Sends the submission as email through Resend        |
| `CONTACT_TO_EMAIL`    | Recipient (defaults to the support address)         |
| `CONTACT_FROM_EMAIL`  | Sender used with Resend                             |

With neither provider configured the API answers `503 not_configured` and the
form shows an honest fallback with a pre-filled `mailto:` link — it never reports
a delivery that did not happen.

A hidden honeypot field silently discards bot submissions.

## Accessibility & motion

- Semantic landmarks, one `<h1>` per route and an unbroken heading order.
- Skip link, visible focus rings, labelled controls, `aria-live` form status.
- Every animation is guarded: `prefers-reduced-motion` disables CSS animation
  globally, Framer Motion components fall back to static rendering, the tech
  marquee becomes a wrapped list, and the pointer glow never mounts on touch
  devices or for users who opted out.

## Deploying

Push the repository and import it on Vercel — no extra configuration is needed.
Set the contact-delivery variables in the Vercel project if you want submissions
delivered. Update `site.url` in `lib/site.ts` if the canonical domain changes;
metadata, canonicals, the sitemap and `robots.txt` all derive from it.
