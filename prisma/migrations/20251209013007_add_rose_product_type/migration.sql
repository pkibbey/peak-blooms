/*
  Warnings:

  - You are about to drop the `HeroBanner` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `company` on table `Address` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MetricType" ADD VALUE 'ADMIN_QUERY';
ALTER TYPE "MetricType" ADD VALUE 'USER_QUERY';

-- AlterEnum
ALTER TYPE "ProductType" ADD VALUE 'ROSE';

-- AlterTable
ALTER TABLE "Address" ALTER COLUMN "company" SET NOT NULL;

-- DropTable
DROP TABLE "HeroBanner";

-- DropEnum
DROP TYPE "HeroBackgroundType";
