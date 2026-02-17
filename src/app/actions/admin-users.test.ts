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
  makeFriendlyOrderId: vi.fn(
    (userId: string, orderId: string) => `${userId}-${String(orderId).slice(-4)}`
  ),
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
    vi.mocked(auth.api.getSession).mockReset()
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
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: true })

      const result = await approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.approved).toBe(true)
      }
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440003" },
        data: { approved: true },
        select: expect.any(Object),
      })
    })

    it("should invalidate session for other users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: true })

      const result = await approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      expect(result.success).toBe(true)

      expect(invalidateUserSessions).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440003")
    })

    it("should not invalidate session if approving self", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({
        ...mockAdminSession.user,
        approved: true,
      })

      const result = await approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440001" })
      expect(result.success).toBe(true)

      expect(invalidateUserSessions).not.toHaveBeenCalled()
    })

    it("should return error if not admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockUserSession)
      const result = await approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if no session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)
      const result = await approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error on db failure", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockRejectedValueOnce(new Error("DB Error"))
      const result = await approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("DB Error")
      }
    })

    it("should return error on non-Error exception", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockRejectedValueOnce("String error")
      const result = await approveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      expect(result.success).toBe(false)
    })
  })

  describe("unapproveUserAction", () => {
    it("should unapprove user successfully", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: false })

      const result = await unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.approved).toBe(false)
      }
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440003" },
        data: { approved: false },
        select: expect.any(Object),
      })
    })

    it("should invalidate sessions for other users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: false })

      const result = await unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      expect(result.success).toBe(true)

      expect(invalidateUserSessions).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440003")
    })

    it("should not invalidate session if unapproving self", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({
        ...mockAdminSession.user,
        approved: false,
      })

      const result = await unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440001" })
      expect(result.success).toBe(true)

      expect(invalidateUserSessions).not.toHaveBeenCalled()
    })

    it("should return error if not admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockUserSession)
      const result = await unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if no session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)
      const result = await unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error on db failure", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockRejectedValueOnce(new Error("DB Error"))
      const result = await unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("DB Error")
      }
    })

    it("should return error on non-Error exception", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockRejectedValueOnce("String Error")
      const result = await unapproveUserAction({ userId: "550e8400-e29b-41d4-a716-446655440003" })
      expect(result.success).toBe(false)
    })
  })

  describe("updateUserPriceMultiplierAction", () => {
    it("should update multiplier if valid", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, priceMultiplier: 1.5 })

      const result = await updateUserPriceMultiplierAction({
        userId: "550e8400-e29b-41d4-a716-446655440003",
        multiplier: 1.5,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priceMultiplier).toBe(1.5)
      }
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440003" },
        data: { priceMultiplier: 1.5 },
        select: expect.any(Object),
      })
    })

    it("should invalidate sessions for other users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, priceMultiplier: 1.5 })

      const result = await updateUserPriceMultiplierAction({
        userId: "550e8400-e29b-41d4-a716-446655440003",
        multiplier: 1.5,
      })
      expect(result.success).toBe(true)

      expect(invalidateUserSessions).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440003")
    })

    it("should not invalidate session for self", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockResolvedValueOnce({
        ...mockAdminSession.user,
        priceMultiplier: 1.5,
      })

      const result = await updateUserPriceMultiplierAction({
        userId: "550e8400-e29b-41d4-a716-446655440001",
        multiplier: 1.5,
      })
      expect(result.success).toBe(true)

      expect(invalidateUserSessions).not.toHaveBeenCalled()
    })

    it("should return error if not admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockUserSession)
      const result = await updateUserPriceMultiplierAction({
        userId: "550e8400-e29b-41d4-a716-446655440003",
        multiplier: 1.0,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if no session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)
      const result = await updateUserPriceMultiplierAction({
        userId: "550e8400-e29b-41d4-a716-446655440003",
        multiplier: 1.0,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error on db failure", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockRejectedValueOnce(new Error("DB Error"))
      const result = await updateUserPriceMultiplierAction({
        userId: "550e8400-e29b-41d4-a716-446655440003",
        multiplier: 1.0,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("DB Error")
      }
    })

    it("should return error on non-Error exception", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.update).mockRejectedValueOnce("String error")
      const result = await updateUserPriceMultiplierAction({
        userId: "550e8400-e29b-41d4-a716-446655440003",
        multiplier: 1.0,
      })
      expect(result.success).toBe(false)
    })
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

    it("should create user if admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockResolvedValueOnce({
        ...userData,
        id: "new-1",
        createdAt: now,
        updatedAt: now,
      })

      const result = await createUserAction(userData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe(userData.email)
      }
      expect(db.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          approved: userData.approved,
          priceMultiplier: userData.priceMultiplier,
        },
        select: expect.any(Object),
      })
    })

    // --- deleteUserAction tests ---
    describe("deleteUserAction", () => {
      it("should delete user successfully", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
        vi.mocked(db.user.delete).mockResolvedValueOnce(mockUser)

        const result = await (await import("./admin-users")).deleteUserAction({
          userId: mockUser.id,
        })

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.id).toBe(mockUser.id)
        }
        expect(db.user.delete).toHaveBeenCalledWith({
          where: { id: mockUser.id },
          select: expect.any(Object),
        })
        expect(invalidateUserSessions).toHaveBeenCalledWith(mockUser.id)
      })

      it("should not allow deleting self", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)

        const result = await (await import("./admin-users")).deleteUserAction({
          userId: mockAdminSession.user.id,
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toContain("Cannot delete yourself")
        }
      })

      it("should refuse to delete users who have invoices attached", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
        // Simulate an order that has a PDF invoice attached
        vi.mocked(db.order.findFirst).mockResolvedValueOnce({
          id: "order-with-invoice",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "1",
          friendlyId: "friendlystring_1",
          status: "PENDING",
          notes: null,
          deliveryAddressId: null,
        })

        const result = await (await import("./admin-users")).deleteUserAction({
          userId: mockUser.id,
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toContain("invoices attached")
        }
        // Ensure we never attempt to delete the user record when invoices exist
        expect(db.user.delete).not.toHaveBeenCalled()
      })

      it("should return error if not admin", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockUserSession)
        const result = await (await import("./admin-users")).deleteUserAction({
          userId: mockUser.id,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.code).toBe("UNAUTHORIZED")
        }
      })

      it("should return error if no session", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(null)
        const result = await (await import("./admin-users")).deleteUserAction({
          userId: mockUser.id,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.code).toBe("UNAUTHORIZED")
        }
      })

      it("should return error on db failure", async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
        vi.mocked(db.user.delete).mockRejectedValueOnce(new Error("DB Error"))
        const result = await (await import("./admin-users")).deleteUserAction({
          userId: mockUser.id,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toContain("DB Error")
        }
      })
    })

    it("should check if email exists before creating", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockResolvedValueOnce({
        ...userData,
        id: "new-1",
        createdAt: now,
        updatedAt: now,
      })

      const result = await createUserAction(userData)
      expect(result.success).toBe(true)

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      })
    })

    it("should return error if email already exists", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser)

      const result = await createUserAction(userData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CONFLICT")
      }
    })

    it("should return error if not admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockUserSession)
      const result = await createUserAction(userData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if no session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)
      const result = await createUserAction(userData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error on db failure", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockRejectedValueOnce(new Error("DB Error"))

      const result = await createUserAction(userData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("DB Error")
      }
    })

    it("should return error on non-Error exception", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockRejectedValueOnce("String error")

      const result = await createUserAction(userData)
      expect(result.success).toBe(false)
    })
  })
})
