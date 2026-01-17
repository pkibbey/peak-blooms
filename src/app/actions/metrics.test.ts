import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies - must be before imports
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}))

vi.mock("@/lib/metrics", () => ({
  getAllMetrics: vi.fn(),
  captureMetric: vi.fn(),
  clearMetrics: vi.fn(),
}))

import { getSession } from "@/lib/auth"
import { captureMetric, clearMetrics, getAllMetrics } from "@/lib/metrics"
import { clearMetricsAction, getMetricsAction, recordMetricAction } from "./metrics"

describe("Metrics Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const now = new Date()
  const mockAdminSession = {
    session: {
      id: "session-1",
      createdAt: now,
      updatedAt: now,
      userId: "admin-1",
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      token: "token-1",
      ipAddress: "127.0.0.1",
      userAgent: "test",
    },
    user: {
      id: "admin-1",
      email: "admin@example.com",
      emailVerified: true,
      name: "Admin User",
      image: null,
      createdAt: now,
      updatedAt: now,
      approved: true,
      role: "ADMIN",
      priceMultiplier: 1,
    },
  }

  const mockMetrics = [
    {
      id: "metric-1",
      type: "QUERY" as const,
      name: "get_products",
      duration: 125,
      createdAt: now,
    },
    {
      id: "metric-2",
      type: "QUERY" as const,
      name: "find_user",
      duration: 45,
      createdAt: now,
    },
  ]

  describe("getMetricsAction", () => {
    it("should return UNAUTHORIZED if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await getMetricsAction()
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should return UNAUTHORIZED if user is not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockAdminSession,
        user: {
          ...mockAdminSession.user,
          role: "USER",
        },
      })

      const result = await getMetricsAction()
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should return all metrics", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(getAllMetrics).mockResolvedValueOnce(mockMetrics)

      const result = await getMetricsAction()

      expect(result).toEqual({
        success: true,
        data: mockMetrics,
      })
      expect(getAllMetrics).toHaveBeenCalled()
    })

    it("should return empty array if no metrics", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(getAllMetrics).mockResolvedValueOnce([])

      const result = await getMetricsAction()

      expect(result).toEqual({
        success: true,
        data: [],
      })
    })

    it("should return SERVER_ERROR for database errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(getAllMetrics).mockRejectedValueOnce(new Error("Database connection failed"))

      const result = await getMetricsAction()
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Database connection failed",
      })
    })
  })

  describe("recordMetricAction", () => {
    it("should return UNAUTHORIZED if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await recordMetricAction({ type: "QUERY", name: "test", duration: 100 })
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should return UNAUTHORIZED if user is not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockAdminSession,
        user: {
          ...mockAdminSession.user,
          role: "USER",
        },
      })

      const result = await recordMetricAction({ type: "QUERY", name: "test", duration: 100 })
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should return VALIDATION_ERROR if type is invalid", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      const result = await recordMetricAction({
        type: "" as unknown as "QUERY",
        name: "test",
        duration: 100,
      })
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })

    it("should return VALIDATION_ERROR if name is invalid", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      const result = await recordMetricAction({ type: "QUERY", name: "", duration: 100 })
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })

    it("should return VALIDATION_ERROR if duration is invalid", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      // Test with null which should fail the number check
      const result = await recordMetricAction({
        type: "QUERY",
        name: "test",
        duration: null as unknown as number,
      })
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })

    it("should return VALIDATION_ERROR if duration is not a number", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      const result = await recordMetricAction({
        type: "QUERY",
        name: "test",
        duration: "100" as unknown as number,
      })
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })

    it("should successfully record metric with valid data", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(captureMetric).mockResolvedValueOnce(undefined)

      const result = await recordMetricAction({
        type: "QUERY",
        name: "get_products",
        duration: 150,
      })

      expect(result).toEqual({
        success: true,
        data: undefined,
      })
      expect(captureMetric).toHaveBeenCalledWith("QUERY", "get_products", 150)
    })

    it("should return SERVER_ERROR for database errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(captureMetric).mockRejectedValueOnce(new Error("Database error"))

      const result = await recordMetricAction({ type: "QUERY", name: "test", duration: 100 })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Database error",
      })
    })

    it("should return SERVER_ERROR for unknown errors", async () => {
      vi.mocked(getSession).mockRejectedValueOnce("String error")

      const result = await recordMetricAction({ type: "QUERY", name: "test", duration: 100 })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "String error",
      })
    })
  })

  describe("clearMetricsAction", () => {
    it("should return UNAUTHORIZED if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await clearMetricsAction()
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should return UNAUTHORIZED if user is not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockAdminSession,
        user: {
          ...mockAdminSession.user,
          role: "USER",
        },
      })

      const result = await clearMetricsAction()
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should clear all metrics and return success message", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(clearMetrics).mockResolvedValueOnce(undefined)

      const result = await clearMetricsAction()

      expect(result).toEqual({
        success: true,
        data: { success: true, message: "All metrics cleared" },
      })
      expect(clearMetrics).toHaveBeenCalled()
    })

    it("should return SERVER_ERROR for database errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(clearMetrics).mockRejectedValueOnce(new Error("Database connection failed"))

      const result = await clearMetricsAction()
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Database connection failed",
      })
    })

    it("should return SERVER_ERROR for unknown errors", async () => {
      vi.mocked(getSession).mockRejectedValueOnce("String error")

      const result = await clearMetricsAction()
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "String error",
      })
    })
  })

  describe("getMetricsAction session checks", () => {
    it("should check for missing session", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await getMetricsAction()
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should check for missing user in session", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockAdminSession,
        user: null as unknown as typeof mockAdminSession.user,
      })

      const result = await getMetricsAction()
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should check user role is ADMIN", async () => {
      const nonAdminSession = {
        ...mockAdminSession,
        user: {
          ...mockAdminSession.user,
          role: "MODERATOR" as unknown as typeof mockAdminSession.user.role,
        },
      }
      vi.mocked(getSession).mockResolvedValueOnce(nonAdminSession)

      const result = await getMetricsAction()
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })
  })
})
