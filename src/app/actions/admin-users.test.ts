import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrismaClient } from "@/test/mocks"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: createMockPrismaClient(),
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
  invalidateUserSessions: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/utils", () => ({
  isValidPriceMultiplier: vi.fn((m) => m >= 0.5 && m <= 2.0),
}))

import { auth, invalidateUserSessions } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  approveUserAction,
  createUserAction,
  unapproveUserAction,
  updateUserPriceMultiplierAction,
} from "./admin-users"

describe("Admin User Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const now = new Date()
  const mockAdminSession = {
    session: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      createdAt: now,
      updatedAt: now,
      userId: "550e8400-e29b-41d4-a716-446655440001",
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      token: "token-admin",
      ipAddress: "127.0.0.1",
      userAgent: "test",
    },
    user: {
      id: "550e8400-e29b-41d4-a716-446655440001",
      email: "admin@example.com",
      emailVerified: true,
      name: "Admin",
      image: null,
      createdAt: now,
      updatedAt: now,
      role: "ADMIN" as const,
      approved: true,
      priceMultiplier: 1.0,
    },
  }

  const mockUserSession = {
    session: {
      id: "550e8400-e29b-41d4-a716-446655440002",
      createdAt: now,
      updatedAt: now,
      userId: "550e8400-e29b-41d4-a716-446655440003",
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      token: "token-user",
      ipAddress: "127.0.0.1",
      userAgent: "test",
    },
    user: {
      id: "550e8400-e29b-41d4-a716-446655440003",
      email: "user@example.com",
      emailVerified: true,
      name: "User",
      image: null,
      createdAt: now,
      updatedAt: now,
      role: "CUSTOMER" as const,
      approved: false,
      priceMultiplier: 1.0,
    },
  }

  const mockUser = {
    id: "550e8400-e29b-41d4-a716-446655440003",
    email: "user@example.com",
    emailVerified: true,
    name: "User",
    image: null,
    createdAt: now,
    updatedAt: now,
    role: "CUSTOMER" as const,
    approved: false,
    priceMultiplier: 1.0,
  }

  describe("approveUserAction", () => {
    it("should approve user successfully", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: true })

      const result = await approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })

      expect(result.approved).toBe(true)
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440003" },
        data: { approved: true },
        select: expect.any(Object),
      })
    })

    it("should invalidate session for other users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: true })

      await approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })

      expect(invalidateUserSessions).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440003")
    })

    it("should not invalidate session if approving self", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({
        ...mockAdminSession.user,
        approved: true,
      })

      await approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440001" })

      expect(invalidateUserSessions).not.toHaveBeenCalled()
    })

    it("should throw error if not admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockUserSession)
      await expect(
        approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      ).rejects.toThrow("Unauthorized")
    })

    it("should throw error if no session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null)
      await expect(
        approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      ).rejects.toThrow("Unauthorized")
    })

    it("should throw custom error on db failure", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockRejectedValueOnce(new Error("DB Error"))
      await expect(
        approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      ).rejects.toThrow("DB Error")
    })

    it("should throw generic error on non-Error exception", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockRejectedValueOnce("String error")
      await expect(
        approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      ).rejects.toThrow("Failed to approve user")
    })
  })

  describe("unapproveUserAction", () => {
    it("should unapprove user successfully", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: false })

      const result = await unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })

      expect(result.approved).toBe(false)
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440003" },
        data: { approved: false },
        select: expect.any(Object),
      })
    })

    it("should invalidate sessions for other users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: false })

      await unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })

      expect(invalidateUserSessions).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440003")
    })

    it("should throw error if not admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockUserSession)
      await expect(
        unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      ).rejects.toThrow("Unauthorized")
    })

    it("should throw error if no session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null)
      await expect(
        unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      ).rejects.toThrow("Unauthorized")
    })

    it("should throw custom error message on db failure", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockRejectedValueOnce(new Error("DB Error"))
      await expect(
        unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      ).rejects.toThrow("DB Error")
    })

    it("should fallback to generic error message", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockRejectedValueOnce("String Error")
      await expect(
        unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      ).rejects.toThrow("Failed to unapprove user")
    })
  })

  describe("updateUserPriceMultiplierAction", () => {
    it("should update multiplier if valid", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, priceMultiplier: 1.5 })

      const result = await updateUserPriceMultiplierAction({
        userId: "550e8400-e29b-41d4-a716-446655440003",
        multiplier: 1.5,
      })

      expect(result.priceMultiplier).toBe(1.5)
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440003" },
        data: { priceMultiplier: 1.5 },
        select: expect.any(Object),
      })
    })

    it("should invalidate sessions for other users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, priceMultiplier: 1.5 })

      await updateUserPriceMultiplierAction({
        userId: "550e8400-e29b-41d4-a716-446655440003",
        multiplier: 1.5,
      })

      expect(invalidateUserSessions).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440003")
    })

    it("should not invalidate session for self", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({
        ...mockAdminSession.user,
        priceMultiplier: 1.5,
      })

      await updateUserPriceMultiplierAction({
        userId: "550e8400-e29b-41d4-a716-446655440001",
        multiplier: 1.5,
      })

      expect(invalidateUserSessions).not.toHaveBeenCalled()
    })

    it("should throw error if multiplier too low", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      await expect(
        updateUserPriceMultiplierAction({
          userId: "550e8400-e29b-41d4-a716-446655440003",
          multiplier: 0.3,
        })
      ).rejects.toThrow("Price multiplier must be at least 0.5")
    })

    it("should throw error if multiplier too high", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      await expect(
        updateUserPriceMultiplierAction({
          userId: "550e8400-e29b-41d4-a716-446655440003",
          multiplier: 3.0,
        })
      ).rejects.toThrow("Price multiplier cannot exceed 2.0")
    })

    it.todo("should throw error if not admin")

    it.todo("should throw error if no session")

    it.todo("should throw custom error on db failure")
  })

  describe("createUserAction", () => {
    const userData = {
      email: "new@example.com",
      name: "New",
      phone: "123",
      role: "CUSTOMER" as const,
      priceMultiplier: 1.0,
      approved: true,
      emailVerified: false,
      image: null,
    }

    it.todo("should create user if admin")

    it("should check if email exists before creating", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockResolvedValueOnce({
        ...userData,
        id: "new-1",
        createdAt: now,
        updatedAt: now,
      })

      await createUserAction(userData)

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      })
    })

    it.todo("should throw error if email already exists")

    it("should throw error if multiplier invalid during creation", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      await expect(createUserAction({ ...userData, priceMultiplier: 0.1 })).rejects.toThrow(
        "Price multiplier must be at least 0.5"
      )
    })

    it.todo("should throw error if not admin")

    it.todo("should throw error if no session")

    it("should throw custom error on db failure", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockRejectedValueOnce(new Error("DB Error"))

      await expect(createUserAction(userData)).rejects.toThrow()
    })

    it("should throw generic error on non-Error exception", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockRejectedValueOnce("String error")

      await expect(createUserAction(userData)).rejects.toThrow()
    })
  })
})
