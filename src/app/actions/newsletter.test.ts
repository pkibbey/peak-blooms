import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrismaClient } from "@/test/mocks"

// Mock dependencies - must be before imports
vi.mock("@/lib/db", () => ({
  db: createMockPrismaClient(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { db } from "@/lib/db"
import { subscribeToNewsletterAction } from "./newsletter"

describe("Newsletter Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const now = new Date()

  describe("subscribeToNewsletterAction", () => {
    it("should reject invalid emails", async () => {
      const result = await subscribeToNewsletterAction("invalid-email")

      // Action silently succeeds even on invalid input to prevent email enumeration
      expect(result).toEqual({ success: true, data: {} })
    })

    it("should silently succeed if user already exists", async () => {
      const existingUser = {
        id: "user-1",
        email: "existing@example.com",
        role: "SUBSCRIBER" as const,
        approved: false,
        emailVerified: false,
        name: null,
        image: null,
        createdAt: now,
        updatedAt: now,
        priceMultiplier: 1,
      }

      vi.mocked(db.user.findUnique).mockResolvedValueOnce(existingUser)

      const result = await subscribeToNewsletterAction("existing@example.com")

      expect(result).toEqual({ success: true, data: {} })
      expect(db.user.create).not.toHaveBeenCalled()
    })

    it("should create new subscriber user with valid email", async () => {
      const newUser = {
        id: "new-user-1",
        email: "new@example.com",
        role: "SUBSCRIBER" as const,
        approved: false,
        emailVerified: false,
        name: null,
        image: null,
        createdAt: now,
        updatedAt: now,
        priceMultiplier: 1,
      }

      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockResolvedValueOnce(newUser)

      const result = await subscribeToNewsletterAction("new@example.com")

      expect(result).toEqual({ success: true, data: { userId: "new-user-1" } })
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: "new@example.com" },
      })
      expect(db.user.create).toHaveBeenCalledWith({
        data: {
          email: "new@example.com",
          role: "SUBSCRIBER",
          approved: false,
          emailVerified: false,
        },
      })
    })

    it("should silently succeed on database errors", async () => {
      vi.mocked(db.user.findUnique).mockRejectedValueOnce(new Error("Database error"))

      const result = await subscribeToNewsletterAction("test@example.com")

      expect(result).toEqual({ success: true, data: {} })
    })

    it("should silently succeed on create errors", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockRejectedValueOnce(new Error("Unique constraint violation"))

      const result = await subscribeToNewsletterAction("test@example.com")

      expect(result).toEqual({ success: true, data: {} })
    })

    it("should handle email with uppercase characters", async () => {
      const newUser = {
        id: "new-user-2",
        email: "New@Example.COM",
        role: "SUBSCRIBER" as const,
        approved: false,
        emailVerified: false,
        name: null,
        image: null,
        createdAt: now,
        updatedAt: now,
        priceMultiplier: 1,
      }

      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockResolvedValueOnce(newUser)

      const result = await subscribeToNewsletterAction("New@Example.COM")

      expect(result).toEqual({ success: true, data: { userId: "new-user-2" } })
    })
  })
})
