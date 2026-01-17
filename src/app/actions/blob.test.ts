import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies - must be before imports
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}))

vi.mock("@/lib/env", () => ({
  ENV: {
    BLOB_READ_WRITE_TOKEN: "test-token",
  },
}))

import { getSession } from "@/lib/auth"
import { deleteBlobAction } from "./blob"

describe("Blob Actions", () => {
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

  describe("deleteBlobAction", () => {
    it("should return UNAUTHORIZED if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await deleteBlobAction({ url: "https://blob.vercel-storage.com/file-123" })
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

      const result = await deleteBlobAction({ url: "https://blob.vercel-storage.com/file-123" })

      expect(result).toMatchObject({
        success: false,
        code: "UNAUTHORIZED",
      })
    })

    it("should return success for non-blob URLs", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      const result = await deleteBlobAction({ url: "https://example.com/file.jpg" })

      expect(result).toEqual({ success: true, data: { success: true } })
    })

    it("should return SERVER_ERROR if blob delete fails", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
      })

      const result = await deleteBlobAction({ url: "https://blob.vercel-storage.com/file-123" })

      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Failed to delete blob: Bad Request",
      })
    })

    it("should return success true if blob delete succeeds", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
      })

      const result = await deleteBlobAction({ url: "https://blob.vercel-storage.com/file-123" })

      expect(result).toEqual({ success: true, data: { success: true } })
      expect(global.fetch).toHaveBeenCalledWith("https://blob.vercel-storage.com/delete", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: "https://blob.vercel-storage.com/file-123" }),
      })
    })

    it("should return SERVER_ERROR on fetch error", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)

      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"))

      const result = await deleteBlobAction({ url: "https://blob.vercel-storage.com/file-123" })

      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Network error",
      })
    })

    it("should return VALIDATION_ERROR on invalid input", async () => {
      const result = await deleteBlobAction({} as never)
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })
  })
})
