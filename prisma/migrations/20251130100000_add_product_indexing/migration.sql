-- Add indexing to Product model to support common filters and array membership
-- GIN index for array membership queries on colors

-- Note: `colors` (text[]) is added in a later migration (20251201000000_add_colors_to_product).
-- The GIN index for `colors` is created there to ensure the column exists first.

-- Partial index for featured products (speeds up queries filtering featured = true)
CREATE INDEX IF NOT EXISTS idx_product_featured_true ON "Product" (featured) WHERE featured = true;

-- Composite index for collection listing ordered by createdAt desc
CREATE INDEX IF NOT EXISTS idx_product_collection_createdat ON "Product" ("collectionId", "createdAt" DESC);

-- Note: Some Prisma-level @@index annotations were added in schema.prisma; these raw SQL indexes
-- complement Prisma indexes where specialized index types (GIN / partial) are required.

-- Rollback (for manual rollback only):
-- DROP INDEX IF EXISTS idx_product_colors_gin;
-- DROP INDEX IF EXISTS idx_product_featured_true;
-- DROP INDEX IF EXISTS idx_product_collection_createdat;
