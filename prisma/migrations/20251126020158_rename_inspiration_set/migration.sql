/*
  Warnings:

  - You are about to drop the `InspirationSet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InspirationSetProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InspirationSetProduct" DROP CONSTRAINT "InspirationSetProduct_inspirationSetId_fkey";

-- DropForeignKey
ALTER TABLE "InspirationSetProduct" DROP CONSTRAINT "InspirationSetProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "InspirationSetProduct" DROP CONSTRAINT "InspirationSetProduct_productVariantId_fkey";

-- DropTable
DROP TABLE "InspirationSet";

-- DropTable
DROP TABLE "InspirationSetProduct";

-- CreateTable
CREATE TABLE "Inspiration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "inspirationText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspiration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspirationProduct" (
    "id" TEXT NOT NULL,
    "inspirationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspirationProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inspiration_slug_key" ON "Inspiration"("slug");

-- CreateIndex
CREATE INDEX "InspirationProduct_inspirationId_idx" ON "InspirationProduct"("inspirationId");

-- CreateIndex
CREATE INDEX "InspirationProduct_productId_idx" ON "InspirationProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InspirationProduct_inspirationId_productId_key" ON "InspirationProduct"("inspirationId", "productId");

-- AddForeignKey
ALTER TABLE "InspirationProduct" ADD CONSTRAINT "InspirationProduct_inspirationId_fkey" FOREIGN KEY ("inspirationId") REFERENCES "Inspiration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspirationProduct" ADD CONSTRAINT "InspirationProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspirationProduct" ADD CONSTRAINT "InspirationProduct_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
