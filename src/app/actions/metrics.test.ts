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
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(getMetricsAction()).rejects.toThrow("Unauthorized")
    })

    it("should throw error if user is not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockAdminSession,
        user: {
          ...mockAdminSession.user,
          role: "USER",
        },
      })

      await expect(getMetricsAction()).rejects.toThrow("Unauthorized")
    })

    it("should return all metrics", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(getAllMetrics).mockResolvedValueOnce(mockMetrics)

      const result = await getMetricsAction()

      expect(result).toEqual(mockMetrics)
      expect(getAllMetrics).toHaveBeenCalled()
    })

    it("should return empty array if no metrics", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(getAllMetrics).mockResolvedValueOnce([])

      const result = await getMetricsAction()

      expect(result).toEqual([])
    })

    it("should propagate database errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(getAllMetrics).mockRejectedValueOnce(new Error("Database connection failed"))

      await expect(getMetricsAction()).rejects.toThrow("Database connection failed")
    })
  })

  describe("recordMetricAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(
        recordMetricAction({ type: "QUERY", name: "test", duration: 100 })
      ).rejects.toThrow("Unauthorized")
    })

    it("should throw error if user is not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockAdminSession,
        user: {
          ...mockAdminSession.user,
          role: "USER",
        },
      })

      await expect(
        recordMetricAction({ type: "QUERY", name: "test", duration: 100 })
      ).rejects.toThrow("Unauthorized")
    })

    it("should throw error if type is invalid", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      await expect(
        recordMetricAction({ type: "" as unknown as "QUERY", name: "test", duration: 100 })
      ).rejects.toThrow("Invalid metric data")
    })

    it("should throw error if name is invalid", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      await expect(recordMetricAction({ type: "QUERY", name: "", duration: 100 })).rejects.toThrow(
        "Invalid metric data"
      )
    })

    it("should throw error if duration is invalid", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      // Test with null which should fail the number check
      await expect(
        recordMetricAction({ type: "QUERY", name: "test", duration: null as unknown as number })
      ).rejects.toThrow("Invalid metric data")
    })

    it("should throw error if duration is not a number", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      await expect(
        recordMetricAction({ type: "QUERY", name: "test", duration: "100" as unknown as number })
      ).rejects.toThrow("Invalid metric data")
    })

    it("should successfully record metric with valid data", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(captureMetric).mockResolvedValueOnce(undefined)

      await recordMetricAction({ type: "QUERY", name: "get_products", duration: 150 })

      expect(captureMetric).toHaveBeenCalledWith("QUERY", "get_products", 150)
    })

    it("should propagate database errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(captureMetric).mockRejectedValueOnce(new Error("Database error"))

      await expect(
        recordMetricAction({ type: "QUERY", name: "test", duration: 100 })
      ).rejects.toThrow("Database error")
    })

    it("should handle non-Error objects in catch", async () => {
      vi.mocked(getSession).mockRejectedValueOnce("String error")

      await expect(
        recordMetricAction({ type: "QUERY", name: "test", duration: 100 })
      ).rejects.toThrow("Failed to record metric")
    })
  })

  describe("clearMetricsAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(clearMetricsAction()).rejects.toThrow("Unauthorized")
    })

    it("should throw error if user is not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockAdminSession,
        user: {
          ...mockAdminSession.user,
          role: "USER",
        },
      })

      await expect(clearMetricsAction()).rejects.toThrow("Unauthorized")
    })

    it("should clear all metrics and return success message", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(clearMetrics).mockResolvedValueOnce(undefined)

      const result = await clearMetricsAction()

      expect(result).toEqual({ success: true, message: "All metrics cleared" })
      expect(clearMetrics).toHaveBeenCalled()
    })

    it("should propagate database errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(clearMetrics).mockRejectedValueOnce(new Error("Database connection failed"))

      await expect(clearMetricsAction()).rejects.toThrow("Database connection failed")
    })

    it("should handle errors and wrap them", async () => {
      vi.mocked(getSession).mockRejectedValueOnce(new Error("Session error"))

      await expect(clearMetricsAction()).rejects.toThrow("Session error")
    })

    it("should handle non-Error objects in catch", async () => {
      vi.mocked(getSession).mockRejectedValueOnce("String error")

      await expect(clearMetricsAction()).rejects.toThrow("Failed to clear metrics")
    })
  })

  describe("getMetricsAction error handling", () => {
    it("should handle non-Error objects in catch", async () => {
      vi.mocked(getSession).mockRejectedValueOnce("String error")

      await expect(getMetricsAction()).rejects.toThrow("Failed to fetch metrics")
    })

    it("should handle Error objects properly", async () => {
      const customError = new Error("Custom auth error")
      vi.mocked(getSession).mockRejectedValueOnce(customError)

      await expect(getMetricsAction()).rejects.toThrow("Custom auth error")
    })

    it("should call getAllMetrics when session is valid", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(getAllMetrics).mockResolvedValueOnce(mockMetrics)

      const result = await getMetricsAction()

      expect(result).toEqual(mockMetrics)
      expect(getAllMetrics).toHaveBeenCalledTimes(1)
    })

    it("should handle error from getAllMetrics", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(getAllMetrics).mockRejectedValueOnce(new Error("Metrics error"))

      await expect(getMetricsAction()).rejects.toThrow("Metrics error")
    })
  })

  describe("getMetricsAction session checks", () => {
    it("should check for missing session", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(getMetricsAction()).rejects.toThrow("Unauthorized")
    })

    it("should check for missing user in session", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockAdminSession,
        user: null as unknown as typeof mockAdminSession.user,
      })

      await expect(getMetricsAction()).rejects.toThrow("Unauthorized")
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

      await expect(getMetricsAction()).rejects.toThrow("Unauthorized")
    })
  })
})
