-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('FLOWER', 'FILLER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "productType" "ProductType" NOT NULL DEFAULT 'FLOWER';

-- CreateIndex
CREATE INDEX "Product_productType_idx" ON "Product"("productType");
