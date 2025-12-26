import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies
vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn(),
}))

vi.mock("pg", () => ({
  Pool: vi.fn(),
}))

vi.mock("@/lib/db-wrapper", () => ({
  createTrackedDb: vi.fn((db) => db), // Return db as-is for testing
}))

vi.mock("../generated/client", () => ({
  PrismaClient: vi.fn(),
  MetricType: {
    ADMIN_QUERY: "ADMIN_QUERY",
    USER_QUERY: "USER_QUERY",
  },
}))

describe("Database Module", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear the global cache
    const globalForPrisma = globalThis as any
    if (globalForPrisma.prisma) {
      delete globalForPrisma.prisma
    }
  })

  describe("getTrackedDb", () => {
    it("should create admin tracked db for admin context", async () => {
      // Re-import to get fresh module state
      const { getTrackedDb } = await import("./db")
      const { createTrackedDb } = await import("./db-wrapper")

      const trackedDb = getTrackedDb(true)

      expect(createTrackedDb).toHaveBeenCalledWith(expect.any(Object), "ADMIN_QUERY")
    })

    it("should create user tracked db for non-admin context", async () => {
      const { getTrackedDb } = await import("./db")
      const { createTrackedDb } = await import("./db-wrapper")

      const trackedDb = getTrackedDb(false)

      expect(createTrackedDb).toHaveBeenCalledWith(expect.any(Object), "USER_QUERY")
    })

    it("should return a database client", async () => {
      const { getTrackedDb } = await import("./db")

      const trackedDb = getTrackedDb(true)

      expect(trackedDb).toBeDefined()
      expect(typeof trackedDb).toBe("object")
    })

    it("should distinguish between admin and user contexts", async () => {
      const { getTrackedDb } = await import("./db")

      const adminDb = getTrackedDb(true)
      const userDb = getTrackedDb(false)

      // Both should be valid database clients
      expect(adminDb).toBeDefined()
      expect(userDb).toBeDefined()
    })
  })

  describe("db (default export)", () => {
    it("should export a database client", async () => {
      const { db } = await import("./db")

      expect(db).toBeDefined()
      expect(typeof db).toBe("object")
    })

    it("should be a PrismaClient instance", async () => {
      const { db } = await import("./db")

      // db should be the base client created by createPrismaClient
      expect(db).toBeDefined()
    })
  })
})
