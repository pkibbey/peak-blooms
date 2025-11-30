-- Migration: drop deprecated "color" column from Product
BEGIN;

-- Remove the legacy single-color column now that `colors` array is supported
ALTER TABLE "Product" DROP COLUMN IF EXISTS "color";

COMMIT;
