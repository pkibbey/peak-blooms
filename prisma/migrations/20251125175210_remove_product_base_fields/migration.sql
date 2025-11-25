/*
  Warnings:

  - You are about to drop the column `count_per_bunch` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stem_length` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "count_per_bunch",
DROP COLUMN "price",
DROP COLUMN "stem_length";
