import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies - must be before imports
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}))

vi.mock("@/lib/metrics", () => ({
  getAllMetrics: vi.fn(),
  clearMetrics: vi.fn(),
}))

import { getSession } from "@/lib/auth"
import { clearMetrics, getAllMetrics } from "@/lib/metrics"
import { clearMetricsAction, getMetricsAction } from "./metrics"

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
        data: { message: "All metrics cleared" },
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
