/*
  Warnings:

  - You are about to drop the `_InspirationSetToProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_InspirationSetToProduct" DROP CONSTRAINT "_InspirationSetToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_InspirationSetToProduct" DROP CONSTRAINT "_InspirationSetToProduct_B_fkey";

-- DropTable
DROP TABLE "_InspirationSetToProduct";

-- CreateTable
CREATE TABLE "InspirationSetProduct" (
    "id" TEXT NOT NULL,
    "inspirationSetId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspirationSetProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InspirationSetProduct_inspirationSetId_idx" ON "InspirationSetProduct"("inspirationSetId");

-- CreateIndex
CREATE INDEX "InspirationSetProduct_productId_idx" ON "InspirationSetProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InspirationSetProduct_inspirationSetId_productId_key" ON "InspirationSetProduct"("inspirationSetId", "productId");

-- AddForeignKey
ALTER TABLE "InspirationSetProduct" ADD CONSTRAINT "InspirationSetProduct_inspirationSetId_fkey" FOREIGN KEY ("inspirationSetId") REFERENCES "InspirationSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspirationSetProduct" ADD CONSTRAINT "InspirationSetProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspirationSetProduct" ADD CONSTRAINT "InspirationSetProduct_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
