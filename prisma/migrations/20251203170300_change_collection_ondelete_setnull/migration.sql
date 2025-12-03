-- Make collectionId nullable so products can exist without a collection
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_collectionId_fkey";
ALTER TABLE "Product" ALTER COLUMN "collectionId" DROP NOT NULL;
ALTER TABLE "Product" ADD CONSTRAINT "Product_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
