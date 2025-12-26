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
    user: {
      id: "admin-1",
      role: "ADMIN",
    },
  }

  const mockUserSession = {
    user: {
      id: "user-1",
      role: "CUSTOMER",
    },
  }

  const mockUser = {
    id: "user-1",
    email: "user@example.com",
    name: "User",
    role: "CUSTOMER",
    approved: false,
    priceMultiplier: 1.0,
    createdAt: now,
  }

  describe("approveUserAction", () => {
    it("should approve user successfully", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: true } as any)

      const result = await approveUserAction("user-1")

      expect(result.approved).toBe(true)
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { approved: true },
        select: expect.any(Object),
      })
    })

    it("should invalidate session for other users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: true } as any)

      await approveUserAction("user-1")

      expect(invalidateUserSessions).toHaveBeenCalledWith("user-1")
    })

    it("should not invalidate session if approving self", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockResolvedValueOnce({
        ...mockAdminSession.user,
        approved: true,
      } as any)

      await approveUserAction("admin-1")

      expect(invalidateUserSessions).not.toHaveBeenCalled()
    })

    it("should throw error if not admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockUserSession as any)
      await expect(approveUserAction("user-1")).rejects.toThrow("Unauthorized")
    })

    it("should throw error if no session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any)
      await expect(approveUserAction("user-1")).rejects.toThrow("Unauthorized")
    })

    it("should throw custom error on db failure", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockRejectedValueOnce(new Error("DB Error"))
      await expect(approveUserAction("user-1")).rejects.toThrow("DB Error")
    })

    it("should throw generic error on non-Error exception", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockRejectedValueOnce("String error")
      await expect(approveUserAction("user-1")).rejects.toThrow("Failed to approve user")
    })
  })

  describe("unapproveUserAction", () => {
    it("should unapprove user successfully", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: false } as any)

      const result = await unapproveUserAction("user-1")

      expect(result.approved).toBe(false)
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { approved: false },
        select: expect.any(Object),
      })
    })

    it("should invalidate sessions for other users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, approved: false } as any)

      await unapproveUserAction("user-1")

      expect(invalidateUserSessions).toHaveBeenCalledWith("user-1")
    })

    it("should throw error if not admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockUserSession as any)
      await expect(unapproveUserAction("user-1")).rejects.toThrow("Unauthorized")
    })

    it("should throw error if no session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any)
      await expect(unapproveUserAction("user-1")).rejects.toThrow("Unauthorized")
    })

    it("should throw custom error message on db failure", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockRejectedValueOnce(new Error("DB Error"))
      await expect(unapproveUserAction("u1")).rejects.toThrow("DB Error")
    })

    it("should fallback to generic error message", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockRejectedValueOnce("String Error")
      await expect(unapproveUserAction("u1")).rejects.toThrow("Failed to unapprove user")
    })
  })

  describe("updateUserPriceMultiplierAction", () => {
    it("should update multiplier if valid", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, priceMultiplier: 1.5 } as any)

      const result = await updateUserPriceMultiplierAction("user-1", 1.5)

      expect(result.priceMultiplier).toBe(1.5)
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { priceMultiplier: 1.5 },
        select: expect.any(Object),
      })
    })

    it("should invalidate sessions for other users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockResolvedValueOnce({ ...mockUser, priceMultiplier: 1.5 } as any)

      await updateUserPriceMultiplierAction("user-1", 1.5)

      expect(invalidateUserSessions).toHaveBeenCalledWith("user-1")
    })

    it("should not invalidate session for self", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockResolvedValueOnce({
        ...mockAdminSession.user,
        priceMultiplier: 1.5,
      } as any)

      await updateUserPriceMultiplierAction("admin-1", 1.5)

      expect(invalidateUserSessions).not.toHaveBeenCalled()
    })

    it("should throw error if multiplier too low", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      await expect(updateUserPriceMultiplierAction("user-1", 0.3)).rejects.toThrow(
        "Price multiplier must be between 0.5 and 2.0"
      )
    })

    it("should throw error if multiplier too high", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      await expect(updateUserPriceMultiplierAction("user-1", 3.0)).rejects.toThrow(
        "Price multiplier must be between 0.5 and 2.0"
      )
    })

    it("should throw error if not admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockUserSession as any)
      await expect(updateUserPriceMultiplierAction("user-1", 1.5)).rejects.toThrow("Unauthorized")
    })

    it("should throw error if no session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any)
      await expect(updateUserPriceMultiplierAction("user-1", 1.5)).rejects.toThrow("Unauthorized")
    })

    it("should throw custom error on db failure", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.update).mockRejectedValueOnce(new Error("DB Error"))
      await expect(updateUserPriceMultiplierAction("user-1", 1.5)).rejects.toThrow("DB Error")
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
    }

    it("should create user if admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockResolvedValueOnce({ ...userData, id: "new-1" } as any)

      const result = await createUserAction(userData)

      expect(result.email).toBe(userData.email)
      expect(db.user.create).toHaveBeenCalled()
    })

    it("should check if email exists before creating", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockResolvedValueOnce({ ...userData, id: "new-1" } as any)

      await createUserAction(userData)

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      })
    })

    it("should throw error if email already exists", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: "ex-1" } as any)

      await expect(createUserAction(userData)).rejects.toThrow("Email already exists")
    })

    it("should throw error if multiplier invalid during creation", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      await expect(createUserAction({ ...userData, priceMultiplier: 0.1 })).rejects.toThrow(
        "Price multiplier must be between 0.5 and 2.0"
      )
    })

    it("should throw error if not admin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockUserSession as any)
      await expect(createUserAction(userData)).rejects.toThrow("Unauthorized")
    })

    it("should throw error if no session", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any)
      await expect(createUserAction(userData)).rejects.toThrow("Unauthorized")
    })

    it("should throw custom error on db failure", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockRejectedValueOnce(new Error("DB Error"))
      await expect(createUserAction(userData)).rejects.toThrow("DB Error")
    })

    it("should throw generic error on non-Error exception", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockAdminSession as any)
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(db.user.create).mockRejectedValueOnce("String error")
      await expect(createUserAction(userData)).rejects.toThrow("Failed to create user")
    })
  })
})
