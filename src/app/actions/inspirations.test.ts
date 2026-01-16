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
      { productId: "550e8400-e29b-41d4-a716-446655440011", quantity: 5 },
      { productId: "550e8400-e29b-41d4-a716-446655440012", quantity: 3 },
    ],
  }

  const mockInspirationResult = {
    id: "550e8400-e29b-41d4-a716-446655440021",
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
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(createInspirationAction(mockInspirationData)).rejects.toThrow("Unauthorized")
    })

    it("should throw error if user is not admin", async () => {
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

      expect(result).toEqual(mockInspirationResult)
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

    it("should throw 'Invalid inspiration data' when Zod validation fails", async () => {
      // @ts-expect-error - intentional invalid input
      await expect(createInspirationAction({})).rejects.toThrow("Invalid inspiration data")
    })

    it("should throw 'Failed to create inspiration' for unknown errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.create).mockImplementationOnce(() => {
        throw "String error"
      })

      await expect(createInspirationAction(mockInspirationData)).rejects.toThrow(
        "Failed to create inspiration"
      )
    })
  })

  describe("updateInspirationAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(
        updateInspirationAction({
          id: "550e8400-e29b-41d4-a716-446655440021",
          ...mockInspirationData,
        })
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
        updateInspirationAction({
          id: "550e8400-e29b-41d4-a716-446655440021",
          ...mockInspirationData,
        })
      ).rejects.toThrow("Unauthorized")
    })

    it("should update inspiration and replace products", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.update).mockResolvedValueOnce(mockInspirationResult)

      const result = await updateInspirationAction({
        id: "550e8400-e29b-41d4-a716-446655440021",
        ...mockInspirationData,
      })

      expect(result).toEqual(mockInspirationResult)
      expect(db.inspiration.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440021" },
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

    it("should throw 'Invalid inspiration data' when Zod validation fails", async () => {
      // @ts-expect-error - intentional invalid input
      await expect(updateInspirationAction({})).rejects.toThrow("Invalid inspiration data")
    })

    it("should propagate Error instances", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.update).mockRejectedValueOnce(new Error("Update failed"))

      await expect(
        updateInspirationAction({
          id: "550e8400-e29b-41d4-a716-446655440021",
          ...mockInspirationData,
        })
      ).rejects.toThrow("Update failed")
    })

    it("should throw 'Failed to update inspiration' for unknown errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.update).mockImplementationOnce(() => {
        throw "String error"
      })

      await expect(
        updateInspirationAction({
          id: "550e8400-e29b-41d4-a716-446655440021",
          ...mockInspirationData,
        })
      ).rejects.toThrow("Failed to update inspiration")
    })
  })

  describe("deleteInspirationAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(
        deleteInspirationAction({ id: "550e8400-e29b-41d4-a716-446655440021" })
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
        deleteInspirationAction({ id: "550e8400-e29b-41d4-a716-446655440021" })
      ).rejects.toThrow("Unauthorized")
    })

    it("should delete inspiration", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.delete).mockResolvedValueOnce(mockInspirationResult)

      const result = await deleteInspirationAction({ id: "550e8400-e29b-41d4-a716-446655440021" })

      expect(result).toEqual({ success: true })
      expect(db.inspiration.delete).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440021" },
      })
    })

    it("should throw 'Invalid inspiration data' when Zod validation fails", async () => {
      // @ts-expect-error - intentional invalid input
      await expect(deleteInspirationAction({})).rejects.toThrow("Invalid inspiration data")
    })

    it("should propagate Error instances", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.delete).mockRejectedValueOnce(new Error("Delete failed"))

      await expect(
        deleteInspirationAction({ id: "550e8400-e29b-41d4-a716-446655440021" })
      ).rejects.toThrow("Delete failed")
    })

    it("should throw 'Failed to delete inspiration' for unknown errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.delete).mockImplementationOnce(() => {
        throw "String error"
      })

      await expect(
        deleteInspirationAction({ id: "550e8400-e29b-41d4-a716-446655440021" })
      ).rejects.toThrow("Failed to delete inspiration")
    })
  })
})
