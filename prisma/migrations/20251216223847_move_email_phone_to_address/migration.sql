/*
  Warnings:

  - You are about to drop the column `email` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Order` table. All the data in the column will be lost.
  - Added the required column `email` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "email",
DROP COLUMN "phone";
