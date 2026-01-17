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
  createAddressAction,
  deleteAddressAction,
  updateAddressAction,
  updateProfileAction,
} from "./user-actions"

describe("User Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const now = new Date()
  const mockUserSession = {
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
      name: "Old Name",
      image: null,
      createdAt: now,
      updatedAt: now,
      approved: true,
      role: "CUSTOMER" as const,
      priceMultiplier: 1,
    },
  }

  const mockUpdatedUser: typeof mockUserSession.user = {
    id: "user-1",
    email: "user@example.com",
    emailVerified: true,
    name: "New Name",
    image: null,
    createdAt: now,
    updatedAt: now,
    approved: true,
    role: "CUSTOMER" as const,
    priceMultiplier: 1,
  }

  const mockAddress = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    userId: "user-1",
    firstName: "John",
    lastName: "Doe",
    company: "Acme Inc",
    street1: "123 Main St",
    street2: "Apt 4B",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "US",
    email: "john@example.com",
    phone: "+1-212-555-0123",
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  }

  describe("updateProfileAction", () => {
    it("should return UNAUTHORIZED if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await updateProfileAction({ name: "New Name" })
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should accept valid profile data", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.user.update).mockResolvedValueOnce(mockUpdatedUser)

      // Empty name is allowed by schema (z.string())
      const result = await updateProfileAction({ name: "" })
      expect(result).toMatchObject({
        success: true,
        data: { id: "user-1" },
      })
    })

    it("should update user profile successfully", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.user.update).mockResolvedValueOnce(mockUpdatedUser)

      const result = await updateProfileAction({ name: "New Name" })

      expect(result).toEqual({
        success: true,
        data: mockUpdatedUser,
      })
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { name: "New Name" },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          approved: true,
          createdAt: true,
        },
      })
    })

    it("should return SERVER_ERROR for database errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.user.update).mockRejectedValueOnce(new Error("Database error"))

      const result = await updateProfileAction({ name: "New Name" })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Database error",
      })
    })

    it("should return SERVER_ERROR for unknown errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.user.update).mockRejectedValueOnce("String error")

      const result = await updateProfileAction({ name: "New Name" })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "String error",
      })
    })

    it("should return VALIDATION_ERROR for invalid profile data", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      const invalidData = { name: 123 }

      const result = await updateProfileAction(invalidData as never)
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })
  })

  describe("createAddressAction", () => {
    const validAddressData = {
      firstName: "John",
      lastName: "Doe",
      company: "Acme Inc",
      street1: "123 Main St",
      street2: "Apt 4B",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "US",
      email: "john@example.com",
      phone: "+1-212-555-0123",
    }

    it("should return UNAUTHORIZED if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await createAddressAction(validAddressData)
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should return VALIDATION_ERROR for invalid address data", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)

      const result = await createAddressAction({
        ...validAddressData,
        firstName: "", // Invalid
      })
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })

    it("should create address without setting as default", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.create).mockResolvedValueOnce(mockAddress)

      const result = await createAddressAction(validAddressData)

      expect(result).toEqual({
        success: true,
        data: mockAddress,
      })
      expect(db.address.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          ...validAddressData,
          street2: validAddressData.street2 || "",
          company: validAddressData.company || "",
          isDefault: false,
        },
      })
    })

    it("should create address as default and unset other defaults", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.updateMany).mockResolvedValueOnce({ count: 1 })
      vi.mocked(db.address.create).mockResolvedValueOnce({ ...mockAddress, isDefault: true })

      const result = await createAddressAction({ ...validAddressData, isDefault: true })

      expect(result).toMatchObject({
        success: true,
        data: { isDefault: true },
      })
      expect(db.address.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isDefault: true },
        data: { isDefault: false },
      })
    })

    it("should return SERVER_ERROR if database create fails", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.create).mockRejectedValueOnce(new Error("Create failed"))

      const result = await createAddressAction(validAddressData)
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Create failed",
      })
    })

    it("should return SERVER_ERROR if updateMany fails", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.updateMany).mockRejectedValueOnce(new Error("UpdateMany failed"))

      const result = await createAddressAction({ ...validAddressData, isDefault: true })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "UpdateMany failed",
      })
    })

    it("should return SERVER_ERROR for unknown errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.create).mockRejectedValueOnce("String error")

      const result = await createAddressAction(validAddressData)
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "String error",
      })
    })
  })

  describe("updateAddressAction", () => {
    const validAddressData = {
      firstName: "Jane",
      lastName: "Smith",
      company: "Tech Corp",
      street1: "456 Oak Ave",
      street2: "Suite 200",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      country: "US",
      email: "jane@example.com",
      phone: "+1-213-555-0456",
    }

    it("should return UNAUTHORIZED if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await updateAddressAction(mockAddress.id, validAddressData)
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should return NOT_FOUND if address not found", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(null)

      const result = await updateAddressAction(mockAddress.id, validAddressData)
      expect(result).toMatchObject({
        success: false,
        code: "NOT_FOUND",
      })
    })

    it("should return NOT_FOUND if user does not own address", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce({
        ...mockAddress,
        userId: "different-user",
      })

      const result = await updateAddressAction(mockAddress.id, validAddressData)
      expect(result).toMatchObject({
        success: false,
        code: "NOT_FOUND",
      })
    })

    it("should update address fields", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(mockAddress)
      vi.mocked(db.address.update).mockResolvedValueOnce({ ...mockAddress, ...validAddressData })

      const result = await updateAddressAction(mockAddress.id, validAddressData)

      expect(result).toEqual({
        success: true,
        data: { ...mockAddress, ...validAddressData },
      })
      expect(db.address.update).toHaveBeenCalledWith({
        where: { id: mockAddress.id },
        data: expect.any(Object),
      })
    })

    it("should update only isDefault without validation", async () => {
      const updatedAddress = { ...mockAddress, isDefault: true }
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(mockAddress)
      vi.mocked(db.address.update).mockResolvedValueOnce(updatedAddress)

      const result = await updateAddressAction(mockAddress.id, { isDefault: true })

      expect(result).toMatchObject({
        success: true,
        data: { isDefault: true },
      })
      expect(db.address.update).toHaveBeenCalledWith({
        where: { id: mockAddress.id },
        data: { isDefault: true },
      })
    })

    it("should unset other defaults when setting as default", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(mockAddress)
      vi.mocked(db.address.updateMany).mockResolvedValueOnce({ count: 1 })
      vi.mocked(db.address.update).mockResolvedValueOnce({ ...mockAddress, isDefault: true })

      await updateAddressAction(mockAddress.id, { isDefault: true })

      expect(db.address.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isDefault: true, NOT: { id: mockAddress.id } },
        data: { isDefault: false },
      })
    })

    it("should return SERVER_ERROR on address update failure", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(mockAddress)
      vi.mocked(db.address.update).mockRejectedValueOnce(new Error("Update failed"))

      const result = await updateAddressAction(mockAddress.id, { isDefault: true })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Update failed",
      })
    })

    it("should handle partial address data with isDefault flag", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(mockAddress)
      vi.mocked(db.address.updateMany).mockResolvedValueOnce({ count: 1 })
      vi.mocked(db.address.update).mockResolvedValueOnce({ ...mockAddress, isDefault: true })

      const result = await updateAddressAction(mockAddress.id, {
        firstName: "Updated",
        lastName: "User",
        company: "New Corp",
        street1: "789 New St",
        street2: "Suite 100",
        city: "Boston",
        state: "MA",
        zip: "02101",
        country: "US",
        email: "updated@example.com",
        phone: "+1-617-555-0789",
        isDefault: true,
      })

      expect(result).toMatchObject({
        success: true,
        data: { isDefault: true },
      })
      expect(db.address.updateMany).toHaveBeenCalled()
    })

    it("should return SERVER_ERROR for unknown errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(mockAddress)
      vi.mocked(db.address.update).mockRejectedValueOnce("String error")

      const result = await updateAddressAction(mockAddress.id, { firstName: "Updated" })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "String error",
      })
    })

    it("should return VALIDATION_ERROR for invalid partial address data", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(mockAddress)

      const result = await updateAddressAction(mockAddress.id, {
        firstName: "", // Invalid
      })
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })
  })

  describe("deleteAddressAction", () => {
    it("should return UNAUTHORIZED if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await deleteAddressAction({ addressId: mockAddress.id })
      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should return NOT_FOUND if address not found", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(null)

      const result = await deleteAddressAction({ addressId: mockAddress.id })
      expect(result).toMatchObject({
        success: false,
        code: "NOT_FOUND",
      })
    })

    it("should return NOT_FOUND if user does not own address", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce({
        ...mockAddress,
        userId: "different-user",
      })

      const result = await deleteAddressAction({ addressId: mockAddress.id })
      expect(result).toMatchObject({
        success: false,
        code: "NOT_FOUND",
      })
    })

    it("should delete address successfully", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(mockAddress)
      vi.mocked(db.address.delete).mockResolvedValueOnce(mockAddress)

      const result = await deleteAddressAction({ addressId: mockAddress.id })

      expect(result).toEqual({ success: true, data: { id: mockAddress.id } })
      expect(db.address.delete).toHaveBeenCalledWith({
        where: { id: mockAddress.id },
      })
    })

    it("should return SERVER_ERROR on address delete failure", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(mockAddress)
      vi.mocked(db.address.delete).mockRejectedValueOnce(new Error("Delete failed"))

      const result = await deleteAddressAction({ addressId: mockAddress.id })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Delete failed",
      })
    })

    it("should return SERVER_ERROR for unknown errors", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)
      vi.mocked(db.address.findUnique).mockResolvedValueOnce(mockAddress)
      vi.mocked(db.address.delete).mockRejectedValueOnce("String error")

      const result = await deleteAddressAction({ addressId: mockAddress.id })
      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "String error",
      })
    })
  })
})
