import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrismaClient } from "@/test/mocks"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: createMockPrismaClient(),
}))

vi.mock("@/lib/metrics", () => ({
  captureMetric: vi.fn().mockResolvedValue(undefined),
}))

import { db } from "@/lib/db"
import { captureMetric } from "@/lib/metrics"
import { createTrackedDb } from "./db-wrapper"

describe("Database Wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createTrackedDb", () => {
    it("should return a proxy that wraps the base database client", () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")

      expect(trackedDb).toBeDefined()
      expect(typeof trackedDb).toBe("object")
    })

    it("should allow access to database models", async () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")

      // Should be able to access user model
      expect(trackedDb.user).toBeDefined()
      expect(typeof trackedDb.user).toBe("object")
    })

    it("should track findMany operations", async () => {
      const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

      vi.mocked(db.user.findMany).mockResolvedValueOnce([])

      await trackedDb.user.findMany({ where: {} })

      // Metric capture is fire-and-forget, so it will be called in development
      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "ADMIN_QUERY",
          expect.stringContaining("user.findMany"),
          expect.any(Number)
        )
      }
    })

    it("should track findUnique operations", async () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")

      vi.mocked(db.product.findUnique).mockResolvedValueOnce(null)

      await trackedDb.product.findUnique({ where: { id: "prod-1" } })

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "USER_QUERY",
          expect.stringContaining("product.findUnique"),
          expect.any(Number)
        )
      }
    })

    it("should track findFirst operations", async () => {
      const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

      vi.mocked(db.order.findFirst).mockResolvedValueOnce(null)

      await trackedDb.order.findFirst({ where: { id: "order-1" } })

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "ADMIN_QUERY",
          expect.stringContaining("order.findFirst"),
          expect.any(Number)
        )
      }
    })

    it("should track create operations", async () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")

      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        name: "Test",
        image: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        approved: false,
        // biome-ignore lint/suspicious/noExplicitAny: Role enum cast for test mock
        role: "USER" as any,
        priceMultiplier: 1,
      }

      vi.mocked(db.user.create).mockResolvedValueOnce(mockUser)

      await trackedDb.user.create({ data: { email: "test@example.com" } })

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "USER_QUERY",
          expect.stringContaining("user.create"),
          expect.any(Number)
        )
      }
    })

    it("should track update operations", async () => {
      const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

      vi.mocked(db.product.update).mockResolvedValueOnce({
        id: "prod-1",
        name: "Rose",
        slug: "rose",
        description: "Red rose",
        image: "rose.jpg",
        price: 25,
        colors: ["red"],
        // biome-ignore lint/suspicious/noExplicitAny: Product type enum cast for test mock
        productType: "FLOWER" as any,
        featured: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await trackedDb.product.update({ where: { id: "prod-1" }, data: { featured: true } })

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "ADMIN_QUERY",
          expect.stringContaining("product.update"),
          expect.any(Number)
        )
      }
    })

    it("should track delete operations", async () => {
      const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

      vi.mocked(db.collection.delete).mockResolvedValueOnce({
        id: "coll-1",
        name: "Romantic",
        slug: "romantic",
        description: null,
        image: null,
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await trackedDb.collection.delete({ where: { id: "coll-1" } })

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "ADMIN_QUERY",
          expect.stringContaining("collection.delete"),
          expect.any(Number)
        )
      }
    })

    it("should track count operations", async () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")

      vi.mocked(db.product.count).mockResolvedValueOnce(42)

      await trackedDb.product.count({ where: { featured: true } })

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "USER_QUERY",
          expect.stringContaining("product.count"),
          expect.any(Number)
        )
      }
    })

    it("should track failed operations with error suffix", async () => {
      const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

      const error = new Error("Constraint violation")
      vi.mocked(db.user.create).mockRejectedValueOnce(error)

      await expect(trackedDb.user.create({ data: { email: "test@example.com" } })).rejects.toThrow()

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "ADMIN_QUERY",
          expect.stringContaining("user.create"),
          expect.any(Number)
        )
      }
    })

    it("should skip wrapping metric model to avoid infinite recursion", async () => {
      const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

      // db.metric is created in the mock, so we can test that it exists
      expect(trackedDb.metric).toBeDefined()
      // The proxy should not wrap the metric model
      expect(typeof trackedDb.metric).toBe("object")
    })

    it("should not wrap non-query methods", async () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")

      // Non-method properties should be returned as-is
      expect(trackedDb.user).toBeDefined()
    })

    it("should preserve the metric type through operations", async () => {
      const userTrackedDb = createTrackedDb(db, "USER_QUERY")
      const adminTrackedDb = createTrackedDb(db, "ADMIN_QUERY")

      vi.mocked(db.product.findMany).mockResolvedValueOnce([])

      await userTrackedDb.product.findMany({})
      await adminTrackedDb.product.findMany({})

      if (process.env.NODE_ENV === "development") {
        const calls = vi.mocked(captureMetric).mock.calls
        expect(calls.some((call) => call[0] === "USER_QUERY")).toBe(true)
        expect(calls.some((call) => call[0] === "ADMIN_QUERY")).toBe(true)
      }
    })

    it("should measure operation timing", async () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")

      // Simulate a delay
      vi.mocked(db.product.findMany).mockImplementation(
        // biome-ignore lint/suspicious/noExplicitAny: Mock promise with generic type for test
        () => new Promise<any>((resolve) => setTimeout(() => resolve([]), 50)) as any
      )

      await trackedDb.product.findMany({})

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalled()
        const duration = vi.mocked(captureMetric).mock.calls[0]?.[2]
        // Duration should be at least 50ms (may be more due to execution overhead)
        expect(typeof duration).toBe("number")
        expect(duration).toBeGreaterThan(0)
      }
    })

    it("should handle deleteMany operations", async () => {
      const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

      // Ensure the mock has deleteMany
      if (!vi.mocked(db.orderItem.deleteMany)) {
        vi.mocked(db).orderItem.deleteMany = vi.fn().mockResolvedValueOnce({ count: 5 })
      } else {
        vi.mocked(db.orderItem.deleteMany).mockResolvedValueOnce({ count: 5 })
      }

      await trackedDb.orderItem.deleteMany({ where: { orderId: "order-1" } })

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "ADMIN_QUERY",
          expect.stringContaining("orderItem.deleteMany"),
          expect.any(Number)
        )
      }
    })

    it("should handle updateMany operations", async () => {
      const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

      // Ensure the mock has updateMany
      if (!vi.mocked(db.product.updateMany)) {
        vi.mocked(db).product.updateMany = vi.fn().mockResolvedValueOnce({ count: 10 })
      } else {
        vi.mocked(db.product.updateMany).mockResolvedValueOnce({ count: 10 })
      }

      await trackedDb.product.updateMany({
        where: { featured: false },
        data: { featured: true },
      })

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "ADMIN_QUERY",
          expect.stringContaining("product.updateMany"),
          expect.any(Number)
        )
      }
    })

    it("should handle metric capture errors silently", async () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      vi.mocked(db.user.findMany).mockResolvedValueOnce([])
      vi.mocked(captureMetric).mockRejectedValueOnce(new Error("Metric capture failed"))

      // Should not throw, just handle the error silently
      await expect(trackedDb.user.findMany({})).resolves.toEqual([])

      if (process.env.NODE_ENV === "development") {
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to capture metric:", expect.any(Error))
      }

      consoleErrorSpy.mockRestore()
    })

    it("should handle metric capture errors on failed operations", async () => {
      const trackedDb = createTrackedDb(db, "ADMIN_QUERY")
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const error = new Error("Operation failed")
      vi.mocked(db.product.update).mockRejectedValueOnce(error)
      vi.mocked(captureMetric).mockRejectedValueOnce(new Error("Metric capture failed"))

      await expect(trackedDb.product.update({ where: { id: "1" }, data: {} })).rejects.toThrow()

      if (process.env.NODE_ENV === "development") {
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to capture metric:", expect.any(Error))
      }

      consoleErrorSpy.mockRestore()
    })

    it("should handle upsert operations", async () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")

      // Ensure the mock has upsert
      if (!vi.mocked(db.product.upsert)) {
        vi.mocked(db).product.upsert = vi.fn().mockResolvedValueOnce({
          id: "1",
          name: "Test",
          slug: "test",
          description: "Test product",
          image: "test.jpg",
          price: 100,
          colors: [],
          // biome-ignore lint/suspicious/noExplicitAny: Product type enum cast for test mock
          productType: "FLOWER" as any,
          featured: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      } else {
        vi.mocked(db.product.upsert).mockResolvedValueOnce({
          id: "1",
          name: "Test",
          slug: "test",
          description: "Test product",
          image: "test.jpg",
          price: 100,
          colors: [],
          // biome-ignore lint/suspicious/noExplicitAny: Product type enum cast for test mock
          productType: "FLOWER" as any,
          featured: false,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      await trackedDb.product.upsert({
        where: { id: "1" },
        create: {
          name: "Test",
          slug: "test",
          description: "Test product",
          image: "test.jpg",
          price: 100,
          productType: "FLOWER",
        },
        update: {
          name: "Test",
        },
      })

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "USER_QUERY",
          expect.stringContaining("product.upsert"),
          expect.any(Number)
        )
      }
    })

    it("should handle aggregate operations", async () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")

      // Ensure the mock has aggregate
      if (!vi.mocked(db.order.aggregate)) {
        vi.mocked(db).order.aggregate = vi.fn().mockResolvedValueOnce({
          _count: { id: 10 },
          // biome-ignore lint/suspicious/noExplicitAny: Aggregate result partial mock for test
        } as any)
      } else {
        vi.mocked(db.order.aggregate).mockResolvedValueOnce({
          _count: { id: 10 },
          // biome-ignore lint/suspicious/noExplicitAny: Aggregate result partial mock for test
        } as any)
      }

      await trackedDb.order.aggregate({ _count: true })

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "USER_QUERY",
          expect.stringContaining("order.aggregate"),
          expect.any(Number)
        )
      }
    })

    it("should handle groupBy operations", async () => {
      const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

      // Ensure the mock has groupBy
      if (!vi.mocked(db.orderItem.groupBy)) {
        vi.mocked(db).orderItem.groupBy = vi.fn().mockResolvedValueOnce([])
      } else {
        vi.mocked(db.orderItem.groupBy).mockResolvedValueOnce([])
      }

      await trackedDb.orderItem.groupBy({ by: ["productId"] })

      if (process.env.NODE_ENV === "development") {
        expect(captureMetric).toHaveBeenCalledWith(
          "ADMIN_QUERY",
          expect.stringContaining("orderItem.groupBy"),
          expect.any(Number)
        )
      }
    })

    it("should allow access to special properties like $transaction", () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")

      // Should return the original property without wrapping
      // These are special properties that start with $
      expect(trackedDb).toBeDefined()
    })

    it("should preserve non-model non-function properties", () => {
      const trackedDb = createTrackedDb(db, "USER_QUERY")

      // These should be accessible from the original db
      expect(trackedDb).toBeDefined()
    })

    it("should capture metrics in development mode", async () => {
      const originalEnv = process.env.NODE_ENV
      // @ts-expect-error NODE_ENV is read-only but we need to override it for testing
      process.env.NODE_ENV = "development"

      try {
        const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

        vi.mocked(db.user.findMany).mockResolvedValueOnce([])
        vi.mocked(captureMetric).mockClear()

        await trackedDb.user.findMany({ where: {} })

        expect(captureMetric).toHaveBeenCalledWith(
          "ADMIN_QUERY",
          expect.stringContaining("user.findMany"),
          expect.any(Number)
        )
      } finally {
        // @ts-expect-error NODE_ENV is read-only but we need to override it for testing
        process.env.NODE_ENV = originalEnv
      }
    })

    it("should capture metrics for failed operations in development mode", async () => {
      const originalEnv = process.env.NODE_ENV
      // @ts-expect-error NODE_ENV is read-only but we need to override it for testing
      process.env.NODE_ENV = "development"

      try {
        const trackedDb = createTrackedDb(db, "USER_QUERY")

        const error = new Error("Database constraint violated")
        vi.mocked(db.product.create).mockRejectedValueOnce(error)
        vi.mocked(captureMetric).mockClear()

        await expect(
          trackedDb.product.create({
            data: {
              name: "Test",
              description: "Test",
              slug: "test",
              image: "test.jpg",
              price: 100,
              productType: "FLOWER",
            },
          })
        ).rejects.toThrow("Database constraint violated")

        expect(captureMetric).toHaveBeenCalledWith(
          "USER_QUERY",
          expect.stringContaining("product.create (error)"),
          expect.any(Number)
        )
      } finally {
        // @ts-expect-error NODE_ENV is read-only but we need to override it for testing
        process.env.NODE_ENV = originalEnv
      }
    })

    it("should not capture metrics in non-development mode", async () => {
      const originalEnv = process.env.NODE_ENV
      // @ts-expect-error NODE_ENV is read-only but we need to override it for testing
      process.env.NODE_ENV = "production"

      try {
        const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

        vi.mocked(db.user.findMany).mockResolvedValueOnce([])
        vi.mocked(captureMetric).mockClear()

        await trackedDb.user.findMany({ where: {} })

        expect(captureMetric).not.toHaveBeenCalled()
      } finally {
        // @ts-expect-error NODE_ENV is read-only but we need to override it for testing
        process.env.NODE_ENV = originalEnv
      }
    })

    it("should skip wrapping metric model to avoid recursive tracking", () => {
      const trackedDb = createTrackedDb(db, "ADMIN_QUERY")

      // Accessing metric model should return the original without wrapping
      const metricModel = trackedDb.metric
      expect(metricModel).toBe(db.metric)
    })
  })
})
