-- Drop ShoppingCart and CartItem tables
DROP TABLE IF EXISTS "CartItem";
DROP TABLE IF EXISTS "ShoppingCart";

-- Drop the default constraint on Order.status
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;

-- Create new enum type with CART status
CREATE TYPE "OrderStatus_new" AS ENUM ('CART', 'PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'SHIPPED');

-- Alter Order table to use new enum
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING "status"::text::"OrderStatus_new";

-- Drop old enum and rename new one
DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

-- Set the new default
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'CART';
