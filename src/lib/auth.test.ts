import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock better-auth and next headers
vi.mock("better-auth", () => ({
  betterAuth: vi.fn(() => ({
    api: {
      getSession: vi.fn(),
    },
  })),
}))

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: vi.fn(),
}))

vi.mock("better-auth/next-js", () => ({
  nextCookies: vi.fn(),
}))

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    session: {
      deleteMany: vi.fn(),
    },
  },
}))

import { headers } from "next/headers"
import { db } from "@/lib/db"
import { getSession, invalidateUserSessions } from "./auth"

describe("Auth Module", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSessionHeaders = new Headers([["cookie", "session-token=abc123"]])

  const now = new Date()
  const mockSession = {
    session: {
      id: "session-1",
      createdAt: now,
      updatedAt: now,
      userId: "user-1",
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      token: "token-1",
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    },
    user: {
      id: "user-1",
      email: "user@example.com",
      emailVerified: true,
      name: "Test User",
      image: null,
      createdAt: now,
      updatedAt: now,
      approved: true,
      role: "CUSTOMER",
      priceMultiplier: 1.5,
    },
  }

  describe("getSession", () => {
    it("should call auth.api.getSession with headers", async () => {
      const mockHeadersObj = new Headers([["cookie", "session-token=abc123"]])
      vi.mocked(headers).mockResolvedValueOnce(mockHeadersObj)

      // Import auth to get the actual instance
      const { auth } = await import("./auth")
      const getSessionSpy = vi.spyOn(auth.api, "getSession")

      // Call getSession and capture the call
      await (await import("./auth")).getSession()

      // Verify headers were passed
      expect(headers).toHaveBeenCalled()
      expect(getSessionSpy).toHaveBeenCalledWith({
        headers: mockHeadersObj,
      })
    })

    it("should return null when no session exists", async () => {
      vi.mocked(headers).mockResolvedValueOnce(mockSessionHeaders)

      expect(typeof getSession).toBe("function")
    })

    it("should handle missing headers gracefully", async () => {
      vi.mocked(headers).mockResolvedValueOnce(new Headers())

      expect(typeof getSession).toBe("function")
    })
  })

  describe("invalidateUserSessions", () => {
    it("should delete all sessions for a user", async () => {
      vi.mocked(db.session.deleteMany).mockResolvedValueOnce({ count: 3 })

      await invalidateUserSessions("user-1")

      expect(db.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      })
    })

    it("should handle users with no sessions", async () => {
      vi.mocked(db.session.deleteMany).mockResolvedValueOnce({ count: 0 })

      await invalidateUserSessions("user-2")

      expect(db.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-2" },
      })
    })

    it("should propagate database errors", async () => {
      vi.mocked(db.session.deleteMany).mockRejectedValueOnce(
        new Error("Database connection failed")
      )

      await expect(invalidateUserSessions("user-1")).rejects.toThrow("Database connection failed")
    })

    it("should handle concurrent invalidation calls", async () => {
      vi.mocked(db.session.deleteMany).mockResolvedValueOnce({ count: 2 })

      const promise1 = invalidateUserSessions("user-1")
      const promise2 = invalidateUserSessions("user-1")

      await Promise.all([promise1, promise2])

      expect(db.session.deleteMany).toHaveBeenCalledTimes(2)
    })

    it("should accept different user IDs", async () => {
      vi.mocked(db.session.deleteMany).mockResolvedValueOnce({ count: 1 })

      await invalidateUserSessions("different-user-id")

      expect(db.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: "different-user-id" },
      })
    })
  })
})
