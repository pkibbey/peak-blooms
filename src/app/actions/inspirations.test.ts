import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrismaClient } from "@/test/mocks"

// Mock dependencies - must be before imports
vi.mock("@/lib/db", () => ({
  db: createMockPrismaClient(),
}))

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  createInspirationAction,
  deleteInspirationAction,
  updateInspirationAction,
} from "./inspirations"

describe("Inspiration Actions", () => {
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

  const mockInspirationData = {
    name: "Modern Wedding",
    slug: "modern-wedding",
    subtitle: "Contemporary floral arrangements",
    image: "wedding.jpg",
    excerpt: "Beautiful modern designs",
    text: "Full description here",
    productSelections: [
      { productId: "prod-1", quantity: 5 },
      { productId: "prod-2", quantity: 3 },
    ],
  }

  const mockInspirationResult = {
    id: "inspiration-1",
    name: mockInspirationData.name,
    slug: mockInspirationData.slug,
    subtitle: mockInspirationData.subtitle,
    image: mockInspirationData.image,
    excerpt: mockInspirationData.excerpt,
    text: mockInspirationData.text,
    createdAt: now,
    updatedAt: now,
  }

  describe("createInspirationAction", () => {
    it.skip("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(createInspirationAction(mockInspirationData)).rejects.toThrow("Unauthorized")
    })

    it.skip("should throw error if user is not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockAdminSession,
        user: {
          ...mockAdminSession.user,
          role: "USER",
        },
      })

      await expect(createInspirationAction(mockInspirationData)).rejects.toThrow("Unauthorized")
    })

    it("should create inspiration with products", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.create).mockResolvedValueOnce(mockInspirationResult)

      const result = await createInspirationAction(mockInspirationData)

      expect(result).toEqual({ success: true, id: "inspiration-1" })
      expect(db.inspiration.create).toHaveBeenCalledWith({
        data: {
          name: mockInspirationData.name,
          slug: mockInspirationData.slug,
          subtitle: mockInspirationData.subtitle,
          image: mockInspirationData.image,
          excerpt: mockInspirationData.excerpt,
          text: mockInspirationData.text,
          products: {
            create: mockInspirationData.productSelections,
          },
        },
      })
    })

    it("should propagate database errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.create).mockRejectedValueOnce(
        new Error("Database constraint violation")
      )

      await expect(createInspirationAction(mockInspirationData)).rejects.toThrow(
        "Database constraint violation"
      )
    })
  })

  describe("updateInspirationAction", () => {
    it.skip("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(
        updateInspirationAction({ id: "inspiration-1", ...mockInspirationData })
      ).rejects.toThrow("Unauthorized")
    })

    it.skip("should throw error if user is not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockAdminSession,
        user: {
          ...mockAdminSession.user,
          role: "USER",
        },
      })

      await expect(
        updateInspirationAction({ id: "inspiration-1", ...mockInspirationData })
      ).rejects.toThrow("Unauthorized")
    })

    it.skip("should update inspiration and replace products", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.update).mockResolvedValueOnce(mockInspirationResult)

      const result = await updateInspirationAction({ id: "inspiration-1", ...mockInspirationData })

      expect(result).toEqual({ success: true, id: "inspiration-1" })
      expect(db.inspiration.update).toHaveBeenCalledWith({
        where: { id: "inspiration-1" },
        data: {
          name: mockInspirationData.name,
          slug: mockInspirationData.slug,
          subtitle: mockInspirationData.subtitle,
          image: mockInspirationData.image,
          excerpt: mockInspirationData.excerpt,
          text: mockInspirationData.text,
          products: {
            deleteMany: {},
            create: mockInspirationData.productSelections,
          },
        },
      })
    })
  })

  describe("deleteInspirationAction", () => {
    it.skip("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(deleteInspirationAction({ id: "inspiration-1" })).rejects.toThrow("Unauthorized")
    })

    it.skip("should throw error if user is not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        ...mockAdminSession,
        user: {
          ...mockAdminSession.user,
          role: "USER",
        },
      })

      await expect(deleteInspirationAction({ id: "inspiration-1" })).rejects.toThrow("Unauthorized")
    })

    it.skip("should delete inspiration", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.delete).mockResolvedValueOnce(mockInspirationResult)

      const result = await deleteInspirationAction({ id: "inspiration-1" })

      expect(result).toEqual({ success: true })
      expect(db.inspiration.delete).toHaveBeenCalledWith({
        where: { id: "inspiration-1" },
      })
    })
  })
})
