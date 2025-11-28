/*
  Warnings:

  - Made the column `productVariantId` on table `InspirationProduct` required. This step will fail if there are existing NULL values in that column.

*/
-- First, update any NULL productVariantId values to use the first variant of their product
UPDATE "InspirationProduct" ip
SET "productVariantId" = (
  SELECT pv.id 
  FROM "ProductVariant" pv 
  WHERE pv."productId" = ip."productId" 
  ORDER BY pv."createdAt" ASC 
  LIMIT 1
)
WHERE ip."productVariantId" IS NULL;

-- DropForeignKey
ALTER TABLE "InspirationProduct" DROP CONSTRAINT "InspirationProduct_productVariantId_fkey";

-- AlterTable
ALTER TABLE "InspirationProduct" ALTER COLUMN "productVariantId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "InspirationProduct" ADD CONSTRAINT "InspirationProduct_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
