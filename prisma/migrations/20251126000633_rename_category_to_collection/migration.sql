-- Rename Category table to Collection (preserving data)

-- Drop existing foreign key constraint
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- Drop existing index on categoryId
DROP INDEX "Product_categoryId_idx";

-- Rename the Category table to Collection
ALTER TABLE "Category" RENAME TO "Collection";

-- Rename the categoryId column to collectionId in Product table
ALTER TABLE "Product" RENAME COLUMN "categoryId" TO "collectionId";

-- Rename constraints and indexes on Collection table
ALTER TABLE "Collection" RENAME CONSTRAINT "Category_pkey" TO "Collection_pkey";
ALTER INDEX "Category_name_key" RENAME TO "Collection_name_key";
ALTER INDEX "Category_slug_key" RENAME TO "Collection_slug_key";

-- Create new index for collectionId
CREATE INDEX "Product_collectionId_idx" ON "Product"("collectionId");

-- Add new foreign key constraint
ALTER TABLE "Product" ADD CONSTRAINT "Product_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
