-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "productImageSnapshot" TEXT,
ADD COLUMN     "productNameSnapshot" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");
