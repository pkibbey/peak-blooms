/*
  Warnings:

  - You are about to drop the column `productVariantId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `productVariantId` on the `InspirationProduct` table. All the data in the column will be lost.
  - You are about to drop the column `productVariantId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the `ProductVariant` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[cartId,productId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price` to the `Product` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add price column with default value
ALTER TABLE "Product" ADD COLUMN "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- Step 2: Populate price from first variant of each product
UPDATE "Product" p
SET price = COALESCE((
  SELECT pv.price 
  FROM "ProductVariant" pv 
  WHERE pv."productId" = p.id 
  ORDER BY pv."createdAt" ASC
  LIMIT 1
), 0.0);

-- Step 3: Drop foreign key constraints
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productVariantId_fkey";
ALTER TABLE "InspirationProduct" DROP CONSTRAINT "InspirationProduct_productVariantId_fkey";
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productVariantId_fkey";
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- Step 4: Drop indexes and columns
DROP INDEX IF EXISTS "CartItem_cartId_productId_productVariantId_key";
ALTER TABLE "CartItem" DROP COLUMN "productVariantId";
ALTER TABLE "InspirationProduct" DROP COLUMN "productVariantId";
ALTER TABLE "OrderItem" DROP COLUMN "productVariantId";

-- Step 5: Drop ProductVariant table
DROP TABLE "ProductVariant";

-- Step 6: Create new unique constraint on CartItem
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");
