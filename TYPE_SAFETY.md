## Plan: Achieve 100% Type Safety Using Generated Types

**TL;DR**: **Moderately simple** (5-6/10 difficulty) with your decisions. Build a centralized query-types file with Prisma helpers, update the schema validator, and derive `SessionUser` from generated types. Core work is mechanical—consolidating scattered type definitions into one source of truth. ~2-3 days of focused work.

### Steps

1. **Create `src/lib/query-types.ts` with Prisma GetPayload helpers** — Define reusable query type exports for common DB operations (e.g., `UserWithCart`, `ProductWithCollections`, `OrderWithItems`). Each exports the inferred type from Prisma's `GetPayload` for its typical `include` pattern. Single source of truth for DB return types.

2. **Refactor `SessionUser` to inherit from Prisma User** — Update [src/lib/auth.ts](src/lib/auth.ts) to extend a Prisma-derived type with optional fields (`?`) for fields not needed in sessions. Stays lightweight for caching but auto-syncs with User schema changes.

3. **Replace manual custom types with query-types imports** — Remove redundant type definitions from [src/lib/types/](src/lib/types/) (e.g., `CachedOrderWithItems`) and replace usages across server actions with imports from `query-types.ts`.

4. **Update server actions to use strict inferred return types** — Modify [src/app/actions/](src/app/actions/) files to return query-types helpers instead of partial/manual typing. Ensure every return path is explicitly typed.

5. **Enhance schema validation script** — Update [scripts/generate-api-schema.ts](scripts/generate-api-schema.ts) to compare Zod schemas against their corresponding Prisma query-types, warn if fields mismatch, validate consistency between API contracts and DB reality.

6. **Audit component props for data type derivation** — Review [src/components/](src/components/) and replace manual `interface Props` with derived types from query-types where components receive entity data. Keep component-specific props for UI state separate.

7. **Run type validation** — Execute `npm run typecheck` and resolve any remaining implicit typing issues. Commit strict types.

### Further Considerations

1. **Query-types Organization** — Should common queries live in one large file, or split by domain (query-types/orders.ts, query-types/products.ts)?

2. **Backward Compatibility** — Any breaking changes to type exports? Current code imports from `@/lib/types/` directly—should you keep those as re-exports for gradual migration?

3. **SessionUser Edge Case** — Will derived SessionUser handle optional fields cleanly (e.g., `phone?: string | null`) so session creation doesn't require full User data?