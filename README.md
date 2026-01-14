<p align="center">
  <img src="./public/logos/logo-dark.png" alt="Peak Blooms" width="400" />
</p>

<h1 align="center">Peak Blooms</h1>

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

- `npm run build` - build for production
- `npm run start` - start the production server
- `npm run lint` - run Biome lint
- `npm run format` - run Biome format
- `npm run test` - run Vitest tests

## Project Structure

- **`app/`** - Next.js app routes, layouts and server actions.
- **`src/components/`** - UI components used across pages (product cards, forms, cart components).
- **`public/`** - Static assets: product images, hero images, collection images and logos.
- **`prisma/`** - Prisma schema, migrations, and seed scripts (`schema.prisma`, `seed.ts`, `seed-products.ts`).
- **`scripts/`** - Utility scripts (schema generation, postinstall hooks, image fetchers).
- **`package.json`** - npm scripts and dependency list (used for dev/build tasks).

Look for domain logic in `src/app` and `src/components` for UI behaviour and `prisma/` for DB models.

## Tech Stack

- **Next.js ^16** - App framework and server rendering
- **React 19** - UI library
- **TypeScript** - Types and developer tooling
- **Prisma 7 & Postgres** - ORM and relational database
- **Tailwind CSS** - Utility-first styling
- **Biome** - Linting & formatting
- **Vitest** - Unit and integration tests

For exact dependency versions, see `package.json`.