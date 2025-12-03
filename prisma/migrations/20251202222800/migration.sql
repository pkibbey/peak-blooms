/*
  Warnings:

  - You are about to drop the column `count_per_bunch` on the `ProductVariant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "count_per_bunch",
ADD COLUMN     "quantity_per_bunch" INTEGER;
