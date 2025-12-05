-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('SEED', 'QUERY', 'FETCH');

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "type" "MetricType" NOT NULL,
    "name" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Metric_type_idx" ON "Metric"("type");

-- CreateIndex
CREATE INDEX "Metric_createdAt_idx" ON "Metric"("createdAt");
