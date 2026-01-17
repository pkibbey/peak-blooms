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
    it("should return UNAUTHORIZED if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await createInspirationAction(mockInspirationData)
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

      const result = await createInspirationAction(mockInspirationData)
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should create inspiration with products", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.create).mockResolvedValueOnce(mockInspirationResult)

      const result = await createInspirationAction(mockInspirationData)

      expect(result).toEqual({
        success: true,
        data: mockInspirationResult,
      })
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

    it("should return SERVER_ERROR for database errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.create).mockRejectedValueOnce(
        new Error("Database constraint violation")
      )

      const result = await createInspirationAction(mockInspirationData)
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Database constraint violation",
      })
    })

    it("should return VALIDATION_ERROR when Zod validation fails", async () => {
      const result = await createInspirationAction({} as never)
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })

    it("should return SERVER_ERROR for unknown errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.create).mockImplementationOnce(() => {
        throw "String error"
      })

      const result = await createInspirationAction(mockInspirationData)
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "String error",
      })
    })
  })

  describe("updateInspirationAction", () => {
    it("should return UNAUTHORIZED if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await updateInspirationAction({
        id: "550e8400-e29b-41d4-a716-446655440021",
        ...mockInspirationData,
      })
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

      const result = await updateInspirationAction({
        id: "550e8400-e29b-41d4-a716-446655440021",
        ...mockInspirationData,
      })
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should update inspiration and replace products", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.update).mockResolvedValueOnce(mockInspirationResult)

      const result = await updateInspirationAction({
        id: "550e8400-e29b-41d4-a716-446655440021",
        ...mockInspirationData,
      })

      expect(result).toEqual({
        success: true,
        data: mockInspirationResult,
      })
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

    it("should return VALIDATION_ERROR when Zod validation fails", async () => {
      const result = await updateInspirationAction({} as never)
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })

    it("should return SERVER_ERROR for Error instances", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.update).mockRejectedValueOnce(new Error("Update failed"))

      const result = await updateInspirationAction({
        id: "550e8400-e29b-41d4-a716-446655440021",
        ...mockInspirationData,
      })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Update failed",
      })
    })

    it("should return SERVER_ERROR for unknown errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.update).mockImplementationOnce(() => {
        throw "String error"
      })

      const result = await updateInspirationAction({
        id: "550e8400-e29b-41d4-a716-446655440021",
        ...mockInspirationData,
      })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "String error",
      })
    })
  })

  describe("deleteInspirationAction", () => {
    it("should return UNAUTHORIZED if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await deleteInspirationAction({ id: "550e8400-e29b-41d4-a716-446655440021" })
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

      const result = await deleteInspirationAction({ id: "550e8400-e29b-41d4-a716-446655440021" })
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should delete inspiration", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.delete).mockResolvedValueOnce(mockInspirationResult)

      const result = await deleteInspirationAction({ id: "550e8400-e29b-41d4-a716-446655440021" })

      expect(result).toEqual({
        success: true,
        data: { id: "550e8400-e29b-41d4-a716-446655440021" },
      })
      expect(db.inspiration.delete).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440021" },
      })
    })

    it("should return VALIDATION_ERROR when Zod validation fails", async () => {
      const result = await deleteInspirationAction({} as never)
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })

    it("should return SERVER_ERROR for Error instances", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.delete).mockRejectedValueOnce(new Error("Delete failed"))

      const result = await deleteInspirationAction({ id: "550e8400-e29b-41d4-a716-446655440021" })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Delete failed",
      })
    })

    it("should return SERVER_ERROR for unknown errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.inspiration.delete).mockImplementationOnce(() => {
        throw "String error"
      })

      const result = await deleteInspirationAction({ id: "550e8400-e29b-41d4-a716-446655440021" })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "String error",
      })
    })
  })
})
