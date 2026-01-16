import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies
vi.mock("react", () => ({
  cache: vi.fn((fn) => fn), // cache() just returns the function as-is in tests
}))

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "@/lib/auth"
import { getCurrentUser } from "./current-user"

describe("Current User", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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
      userAgent: "test",
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
      role: "ADMIN",
      priceMultiplier: 1.5,
    },
  }

  describe("getCurrentUser", () => {
    it("should return null when no session exists", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await getCurrentUser()

      expect(result).toBeNull()
    })

    it("should return null when session has no user", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        session: mockSession.session,
        user: null as never,
      })

      const result = await getCurrentUser()

      expect(result).toBeNull()
    })

    it("should return null when user has no email", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockSession,
        user: {
          ...mockSession.user,
          email: "",
        },
      })

      const result = await getCurrentUser()

      expect(result).toBeNull()
    })

    it("should return user object with all required fields", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockSession)

      const result = await getCurrentUser()

      expect(result).toEqual({
        id: "user-1",
        email: "user@example.com",
        name: "Test User",
        role: "ADMIN",
        approved: true,
        priceMultiplier: 1.5,
      })
    })

    it("should return null name when user name is undefined", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockSession,
        user: {
          ...mockSession.user,
          name: "",
        },
      })

      const result = await getCurrentUser()

      expect(result?.name).toBeUndefined()
    })

    it("should default role to CUSTOMER when not provided", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockSession,
        user: {
          ...mockSession.user,
          role: null as never,
        },
      })

      const result = await getCurrentUser()

      expect(result?.role).toBe("CUSTOMER")
    })

    it("should default approved to false when not provided", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockSession,
        user: {
          ...mockSession.user,
          approved: null as never,
        },
      })

      const result = await getCurrentUser()

      expect(result?.approved).toBe(false)
    })

    it("should default priceMultiplier to 1.0 when not provided", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockSession,
        user: {
          ...mockSession.user,
          priceMultiplier: null as never,
        },
      })

      const result = await getCurrentUser()

      expect(result?.priceMultiplier).toBe(1.0)
    })

    it("should handle CUSTOMER role correctly", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockSession,
        user: {
          ...mockSession.user,
          role: "CUSTOMER",
        },
      })

      const result = await getCurrentUser()

      expect(result?.role).toBe("CUSTOMER")
    })

    it("should handle ADMIN role correctly", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockSession)

      const result = await getCurrentUser()

      expect(result?.role).toBe("ADMIN")
    })

    it("should handle different price multipliers", async () => {
      const testCases = [1.0, 1.5, 2.0, 0.5]

      for (const multiplier of testCases) {
        vi.mocked(getSession).mockResolvedValueOnce({
          ...mockSession,
          user: {
            ...mockSession.user,
            priceMultiplier: multiplier,
          },
        })

        const result = await getCurrentUser()

        expect(result?.priceMultiplier).toBe(multiplier)
      }
    })

    it("should handle session with minimal user data", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        session: mockSession.session,
        user: {
          id: "user-2",
          email: "minimal@example.com",
          emailVerified: false,
          name: "",
          image: null,
          createdAt: now,
          updatedAt: now,
          approved: false,
          role: "CUSTOMER",
          priceMultiplier: 1,
        },
      })

      const result = await getCurrentUser()

      expect(result).toEqual({
        id: "user-2",
        email: "minimal@example.com",
        name: undefined,
        role: "CUSTOMER",
        approved: false,
        priceMultiplier: 1.0,
      })
    })

    it("should not throw when getSession throws", async () => {
      vi.mocked(getSession).mockRejectedValueOnce(new Error("Auth service error"))

      await expect(getCurrentUser()).rejects.toThrow("Auth service error")
    })

    it("should preserve user email from session", async () => {
      const testEmails = ["user@example.com", "admin@company.com", "test+tag@email.co.uk"]

      for (const email of testEmails) {
        vi.mocked(getSession).mockResolvedValueOnce({
          ...mockSession,
          user: {
            ...mockSession.user,
            email,
          },
        })

        const result = await getCurrentUser()

        expect(result?.email).toBe(email)
      }
    })
  })
})
