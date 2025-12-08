import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { MetricType, PrismaClient } from "../generated/client"
import { createTrackedDb } from "./db-wrapper"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: ["warn", "error"],
  })
}

const baseDb = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseDb

/**
 * Default database client (untracked, used when tracking context is not needed)
 */
export const db = baseDb

/**
 * Create a tracked database client for a specific context
 * @param isAdmin - Whether this is an admin context (affects metric categorization)
 * @returns A database client with query tracking enabled
 */
export function getTrackedDb(isAdmin: boolean) {
  const metricType = isAdmin ? MetricType.ADMIN_QUERY : MetricType.USER_QUERY
  return createTrackedDb(baseDb, metricType)
}
