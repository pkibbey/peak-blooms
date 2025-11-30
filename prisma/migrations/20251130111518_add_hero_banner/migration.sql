-- CreateEnum
CREATE TYPE "HeroBackgroundType" AS ENUM ('IMAGE', 'GRADIENT');

-- CreateTable
CREATE TABLE "HeroBanner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "backgroundType" "HeroBackgroundType" NOT NULL DEFAULT 'GRADIENT',
    "backgroundImage" TEXT,
    "gradientPreset" TEXT,
    "slotPosition" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeroBanner_slug_key" ON "HeroBanner"("slug");

-- CreateIndex
CREATE INDEX "HeroBanner_slotPosition_idx" ON "HeroBanner"("slotPosition");
