-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "orderNumber" DROP DEFAULT,
ALTER COLUMN "orderNumber" SET DATA TYPE TEXT;
DROP SEQUENCE "Order_orderNumber_seq";

-- CreateTable
CREATE TABLE "OrderAttachment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "mime" TEXT NOT NULL DEFAULT 'application/pdf',
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderAttachment_orderId_idx" ON "OrderAttachment"("orderId");

-- AddForeignKey
ALTER TABLE "OrderAttachment" ADD CONSTRAINT "OrderAttachment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
