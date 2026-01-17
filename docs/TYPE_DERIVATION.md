# Type Derivation Patterns

This document explains the patterns we use to derive TypeScript types from Prisma models and how to expose them to the app.

## Why derive types from Prisma

Using Prisma's `GetPayload` keeps types aligned with the database schema and avoids duplicate interfaces. It also enables precise `select`/`include` shapes.

## Common patterns

- Product (detailed include):

```ts
export type ProductFull = ProductGetPayload<{
  include: {
    productCollections: { include: { collection: true } }
  }
}>
```

- Minimal product for search:

```ts
export type ProductBasic = ProductGetPayload<true>

export type SearchProductsResult = {
  products: Array<Pick<ProductBasic, "id" | "name" | "slug" | "image" | "price">>
}
```

- Order with items:

```ts
export type OrderWithItems = OrderGetPayload<{
  include: { items: { include: { product: true } } }
}>
```

## Best practices

- Be explicit with `select`/`include` when returning data from server actions to improve type narrowness and performance.
- Re-export app-facing types from `src/lib/query-types.ts` so components and tests use a single source of truth.
- Use `Omit`/`Pick` to shape payloads for responses rather than introducing new interfaces.

## Examples

Server action returning a typed response:

```ts
import type { AppResult, InspirationForResponse } from "@/lib/query-types"

export async function createInspirationAction(
  input: CreateInspirationInput
): Promise<AppResult<InspirationForResponse>> { ... }
```

Document any non-obvious conversions (e.g., snapshot fields that may be null) in the type doc comment near the type definition.