-- Update NULL prices to 0 in Product table
UPDATE "Product" SET "price" = 0 WHERE "price" IS NULL;

-- Update NULL prices to 0 in OrderItem table
UPDATE "OrderItem" SET "price" = 0 WHERE "price" IS NULL;

-- AlterTable Product - make price non-nullable with default 0
ALTER TABLE "Product" ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DEFAULT 0;

-- AlterTable OrderItem - make price non-nullable with default 0
ALTER TABLE "OrderItem" ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DEFAULT 0;
