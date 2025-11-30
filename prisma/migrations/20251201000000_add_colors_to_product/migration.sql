-- Migration: add colors text[] column to Product and backfill from existing color
BEGIN;

-- Add nullable text[] column
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "colors" TEXT[];

-- Backfill arrays from existing color column for legacy rows
UPDATE "Product" SET "colors" = ARRAY["color"]::text[] WHERE "color" IS NOT NULL;

-- Create GIN index to support fast membership queries on colors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_product_colors_gin'
  ) THEN
    EXECUTE 'CREATE INDEX idx_product_colors_gin ON "Product" USING GIN ("colors")';
  END IF;
END
$$;

COMMIT;
