-- Rename shippingAddressId column to deliveryAddressId on Order table
ALTER TABLE "Order" RENAME COLUMN "shippingAddressId" TO "deliveryAddressId";

-- Drop the old FK constraint (if exists) and create a new FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Order_shippingAddressId_fkey'
  ) THEN
    ALTER TABLE "Order" DROP CONSTRAINT "Order_shippingAddressId_fkey";
  END IF;
END$$;

-- Add new FK constraint referencing Address(id)
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove SHIPPED enum value since OUT_FOR_DELIVERY already exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'OrderStatus' AND e.enumlabel = 'SHIPPED'
  ) THEN
    -- Drop the default constraint on status column
    ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
    
    -- Create a new enum type without SHIPPED
    CREATE TYPE "OrderStatus_new" AS ENUM ('CART', 'PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
    
    -- Update any rows with SHIPPED status to OUT_FOR_DELIVERY
    UPDATE "Order" SET "status" = 'OUT_FOR_DELIVERY' WHERE "status" = 'SHIPPED';
    
    -- Alter the column to use the new enum type
    ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING "status"::text::"OrderStatus_new";
    
    -- Drop the old enum and rename the new one
    DROP TYPE "OrderStatus";
    ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
    
    -- Set the new default
    ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'CART';
  END IF;
END$$;

-- If you have any indexes referencing shippingAddressId, rename them accordingly
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indrelid
    WHERE c.relname = 'Order' AND i.indkey::text LIKE '%shippingAddressId%'
  ) THEN
    -- No-op: index renaming may require inspecting pg_indexes. Manual action might be needed.
  END IF;
END$$;
