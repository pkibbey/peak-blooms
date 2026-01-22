import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { MetricType, PrismaClient } from "@/generated/client"
import { createTrackedDb } from "./db-wrapper"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please ensure your .env.local file is configured correctly."
    )
  }

  try {
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({
      adapter,
      log: ["warn", "error"],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred"
    throw new Error(
      `Failed to connect to database. Make sure Docker is running and DATABASE_URL is correct. Details: ${message}`
    )
  }
}

let baseDb: PrismaClient
try {
  baseDb = globalForPrisma.prisma || createPrismaClient()
} catch (error) {
  console.error(
    "❌ Database connection failed at startup:",
    error instanceof Error ? error.message : error
  )
  // Create a dummy client that will throw on actual queries
  baseDb = {
    $connect: async () => {
      throw error
    },
    $disconnect: async () => {},
  } as unknown as PrismaClient
}

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
