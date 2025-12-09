/*
  Warnings:

  - You are about to drop the column `billingAddressId` on the `Order` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_billingAddressId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "billingAddressId";
