-- Remove `orderNumber` from Order model and enforce `friendlyId` as required
-- NOTE: This migration deletes existing order data (per project decision)

BEGIN;

-- Remove dependent records first
DELETE FROM "OrderAttachment";
DELETE FROM "OrderItem";
DELETE FROM "Order";

-- Drop indexes related to orderNumber (if present)
DROP INDEX IF EXISTS "Order_orderNumber_key";
DROP INDEX IF EXISTS "Order_orderNumber_idx";

-- Remove the column
ALTER TABLE "Order" DROP COLUMN IF EXISTS "orderNumber";

-- Ensure `friendlyId` column exists in the shadow DB (some migration histories never added it)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "friendlyId" TEXT;

-- Ensure friendlyId is non-nullable (all new orders must have it)
ALTER TABLE "Order" ALTER COLUMN "friendlyId" SET NOT NULL;

-- Ensure unique index exists for friendlyId
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'Order_friendlyId_key'
  ) THEN
    CREATE UNIQUE INDEX "Order_friendlyId_key" ON "Order"("friendlyId");
  END IF;
END$$;

COMMIT;