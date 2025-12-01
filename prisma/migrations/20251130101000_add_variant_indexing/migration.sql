-- Add indexing to ProductVariant to support variant filtering used by getProducts

-- Composite index to accelerate productId + price range checks
-- Note: Prisma Migrate cannot run CREATE INDEX CONCURRENTLY inside a transaction.
-- These statements use non-CONCURRENTLY CREATE INDEX so they can be applied by Prisma.
-- If you prefer to create indexes concurrently in production (to avoid table locks),
-- run the concurrent statements directly against the DB (psql) or use a non-transactional process.
CREATE INDEX IF NOT EXISTS idx_variant_product_price ON "ProductVariant" ("productId", price);

-- Composite index to accelerate productId + stem_length range checks
CREATE INDEX IF NOT EXISTS idx_variant_product_stem_length ON "ProductVariant" ("productId", "stem_length");

-- Partial index for variants that are boxlot (speeds up boxlotOnly queries)
CREATE INDEX IF NOT EXISTS idx_variant_product_boxlot_true ON "ProductVariant" ("productId") WHERE is_boxlot = true;

-- Rollback hints (manual rollback):
-- DROP INDEX IF EXISTS idx_variant_product_price;
-- DROP INDEX IF EXISTS idx_variant_product_stem_length;
-- DROP INDEX IF EXISTS idx_variant_product_boxlot_true;
