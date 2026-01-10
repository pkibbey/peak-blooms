# Peak Blooms

A modern e-commerce storefront for curated floral collections and gifts. The app provides product collections, product detail pages, a shopping cart, and order workflows backed by Prisma and Postgres.

[Live Demo](https://peak-blooms.vercel.app/)

## Features

- **Storefront UI:** Responsive listing pages, collection pages, and product detail views with hero imagery.
- **Cart & Checkout:** Client-side cart utilities and server-backed order handling.
- **Prisma-backed DB:** Data model, migrations, and seed scripts for products and orders.
- **Image asset pipeline:** Local `public/` images for collections, products, and hero sections.
- **Type-safe stack:** Built with TypeScript and React 19 for predictable types and developer ergonomics.
- **Dev tooling:** Linting/formatting with Biome, testing with Vitest, and build via Next.js.

## Getting Started

### Prerequisites

- **Node:** 24 or newer
- **Package manager:** `npm` v11 or newer
- **Database:** Postgres for local development (or use `DATABASE_URL` pointing to a dev Postgres instance)

### Installation & Development

Clone and install:

```bash
git clone <repo-url>
cd peak-blooms
npm install
```

Create a local `.env.local` with your `DATABASE_URL` and any other env variables used by the app.

Run the app in development:

```bash
npm run dev
```

Database helpers (use the provided npm scripts):

```bash
# apply migrations and push schema for local dev
npm run db:migrate:dev

# generate Prisma client
npm run db:generate:dev

# seed the development database
npm run db:seed:dev

# open Prisma Studio
npm run db:studio:dev
```

Other useful scripts:

- `npm run build` — build for production
- `npm run start` — start the production server
- `npm run lint` — run Biome lint
- `npm run format` — run Biome format
- `npm run test` — run Vitest tests

## Project Structure

- **`app/`** — Next.js app routes, layouts and server actions.
- **`src/components/`** — UI components used across pages (product cards, forms, cart components).
- **`public/`** — Static assets: product images, hero images, collection images and logos.
- **`prisma/`** — Prisma schema, migrations, and seed scripts (`schema.prisma`, `seed.ts`, `seed-products.ts`).
- **`scripts/`** — Utility scripts (schema generation, postinstall hooks, image fetchers).
- **`package.json`** — npm scripts and dependency list (used for dev/build tasks).

Look for domain logic in `src/app` and `src/components` for UI behaviour and `prisma/` for DB models.

## Tech Stack

- **Next.js ^16** — App framework and server rendering
- **React 19** — UI library
- **TypeScript** — Types and developer tooling
- **Prisma 7 & Postgres** — ORM and relational database
- **Tailwind CSS** — Utility-first styling
- **Biome** — Linting & formatting
- **Vitest** — Unit and integration tests

For exact dependency versions, see `package.json`.

---

If you want, I can: add a short screenshots section, wire a README badge for CI, or create example `.env.local` contents next.
# Peak Blooms

Peak Blooms is a modern wholesale flower shop application built with Next.js. It serves as a B2B e-commerce platform with a focus on clean design and inspirational content for florists.

![Peak Blooms — homepage screenshot](public/images/homepage-screenshot.png)

## Documentation

- [Functional Requirements](docs/functional_requirements.md): Details on user roles, features, and application logic.
- [Style Guide](docs/style_guide.md): Information on the color palette, UI components, and design principles.

## Project Overview

This application is designed to be:

- **Professional & Modern:** A clean aesthetic distinguishing it from competitors.
- **Efficient:** Streamlined B2B purchasing workflow.
- **Inspirational:** Content to engage smaller florist businesses.

### Key Features

- **Dual User Roles:** Customer (requires approval) and Admin — separate experiences and workflows.
- **Conditional Visibility:** Prices and cart are hidden for guests; only approved customers can purchase.
- **Full Text Search & Filters:** Fast product discovery via free-text search, categories, and helpful filters.
- **Curated Collections & Inspiration:** Editorial-led collections and inspiration pages to help retailers discover new assortments.
- **Quick Reorder & Bulk Orders:** Repeatable orders and streamlined cart workflows for wholesale customers.
- **Analytics & Leads:** Built-in admin analytics and lead collection to understand customer behavior and outreach.

### Design & Functionality

- Clean, intentional visual language focused on product imagery and curation.
- Mobile-first responsive layouts with a B2B-first UX (quick adds, bulk selection, and reorder flows).
- Accessibility-minded components and consistent design tokens (see `src/components/ui/`).
- Developer-first setup — local seed data, clear conventions, and standard Next.js tooling.

### Planned / Optional Improvements

- Integrate a real email provider for transactional emails (SMTP / Sendgrid / Mailgun).
- Add payment processing and delivery options to support live orders.
- Add unit and end-to-end tests for stability, and CI checks to prevent regressions.
- Improve perceived performance with client-side loading states and skeletons for a snappier feel.
- Add marketing/analytics hooks, coupon codes, and a newsletter signup flow to support growth.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Seeded development accounts

For local development the seed script creates a few test users you can use in the admin and app:

- Admin: `phineas.kibbey@gmail.com` (role: ADMIN)
- Pending user: `pending@peakblooms.com` (role: CUSTOMER, not approved)
- Customer: `customer@peakblooms.com` (role: CUSTOMER, approved)
- Newsletter subscriber: `newsletter@peakblooms.com` (role: SUBSCRIBER)

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org)
- **Styling:** Tailwind CSS
- **Font:** [Geist](https://vercel.com/font)

## Conventions

UI primitives are located in `src/components/ui/`. For consistent visual tokens, accessible keyboard/focus behavior, and predictable styling, use the shared `Button` component for all interactive controls and CTAs. To style a Next.js `Link` like a button, use the `Button` component's `render` prop and pass the `Link` element to it so routing semantics are preserved.
