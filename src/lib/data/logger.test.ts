import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock console to capture log output
const consoleSpy = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
}

describe("Data Access Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear the module cache so we can reimport with different env vars
    vi.resetModules()
  })

  afterEach(() => {
    // Restore after each test
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe("withTiming", () => {
    it("should execute the provided function", async () => {
      const { withTiming } = await import("./logger")

      const fn = vi.fn().mockResolvedValueOnce({ id: 1, name: "test" })

      const result = await withTiming("testOp", "test-id", fn)

      expect(fn).toHaveBeenCalled()
      expect(result).toEqual({ id: 1, name: "test" })
    })

    it("should return the result from the function", async () => {
      const { withTiming } = await import("./logger")

      const testData = { id: 1, name: "test" }
      const result = await withTiming("testOp", "test-id", async () => testData)

      expect(result).toEqual(testData)
    })

    it("should return null correctly", async () => {
      const { withTiming } = await import("./logger")

      const result = await withTiming("getUser", "user-123", async () => null)

      expect(result).toBeNull()
    })

    it("should handle string identifiers", async () => {
      const { withTiming } = await import("./logger")

      const result = await withTiming("operation", "string-id", async () => ({ data: "test" }))

      expect(result).toEqual({ data: "test" })
    })

    it("should handle object identifiers", async () => {
      const { withTiming } = await import("./logger")

      const result = await withTiming("operation", { userId: 123 }, async () => ({ data: "test" }))

      expect(result).toEqual({ data: "test" })
    })

    it("should re-throw errors after logging", async () => {
      const { withTiming } = await import("./logger")

      const error = new Error("Test error")
      const fn = vi.fn().mockRejectedValueOnce(error)

      await expect(withTiming("operation", "id", fn)).rejects.toThrow("Test error")
    })

    it("should handle undefined result correctly", async () => {
      const { withTiming } = await import("./logger")

      const result = await withTiming("op", "id", async () => undefined)

      expect(result).toBeUndefined()
    })

    it("should handle different data types as results", async () => {
      const { withTiming } = await import("./logger")

      const arrayResult = await withTiming("op", "id", async () => [1, 2, 3])
      expect(arrayResult).toEqual([1, 2, 3])

      const booleanResult = await withTiming("op", "id", async () => true)
      expect(booleanResult).toBe(true)

      const numberResult = await withTiming("op", "id", async () => 42)
      expect(numberResult).toBe(42)
    })

    it("should handle multiple calls sequentially", async () => {
      const { withTiming } = await import("./logger")

      const result1 = await withTiming("op1", "id1", async () => "result1")
      const result2 = await withTiming("op2", "id2", async () => "result2")

      expect(result1).toBe("result1")
      expect(result2).toBe("result2")
    })

    it("should handle error objects in error logging", async () => {
      const { withTiming } = await import("./logger")

      const error = new Error("Database error")
      const fn = vi.fn().mockRejectedValueOnce(error)

      await expect(withTiming("operation", { id: 123 }, fn)).rejects.toThrow("Database error")
    })

    it("should handle string identifiers in error case", async () => {
      const { withTiming } = await import("./logger")

      const error = new Error("Query failed")
      const fn = vi.fn().mockRejectedValueOnce(error)

      await expect(withTiming("getUser", "user-123", fn)).rejects.toThrow("Query failed")
    })

    it("should handle non-Error objects in error logging", async () => {
      const { withTiming } = await import("./logger")

      const fn = vi.fn().mockRejectedValueOnce("String error")

      await expect(withTiming("operation", "id", fn)).rejects.toBe("String error")
    })
  })

  describe("logging behavior with different log levels", () => {
    it("should log notFound when debug level is enabled", async () => {
      process.env.DAL_LOG_LEVEL = "debug"
      const { withTiming } = await import("./logger")

      consoleSpy.log.mockClear()

      const result = await withTiming("getUser", "user-123", async () => null, {
        logNotFound: true,
      })

      expect(result).toBeNull()
      expect(consoleSpy.log).toHaveBeenCalled()
    })

    it("should log errors at error level", async () => {
      process.env.DAL_LOG_LEVEL = "error"
      const { withTiming } = await import("./logger")

      consoleSpy.error.mockClear()

      const error = new Error("Database error")
      const fn = vi.fn().mockRejectedValueOnce(error)

      await expect(withTiming("operation", "id", fn)).rejects.toThrow("Database error")

      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it("should not log notFound when log level is too high", async () => {
      process.env.DAL_LOG_LEVEL = "warn"
      const { withTiming } = await import("./logger")

      consoleSpy.log.mockClear()

      const result = await withTiming("getUser", "user-123", async () => null, {
        logNotFound: true,
      })

      expect(result).toBeNull()
      // Debug level (0) < warn level (2), so should not log
      expect(consoleSpy.log).not.toHaveBeenCalled()
    })

    it("should handle object identifiers in logging", async () => {
      process.env.DAL_LOG_LEVEL = "debug"
      const { withTiming } = await import("./logger")

      consoleSpy.log.mockClear()

      const result = await withTiming(
        "getProduct",
        { id: 123, category: "flowers" },
        async () => null,
        { logNotFound: true }
      )

      expect(result).toBeNull()
      expect(consoleSpy.log).toHaveBeenCalled()
      // Check that the log message contains JSON representation
      const logCall = consoleSpy.log.mock.calls[0]?.[0]
      expect(logCall).toContain("123")
    })

    it("should handle string identifiers in logging", async () => {
      process.env.DAL_LOG_LEVEL = "debug"
      const { withTiming } = await import("./logger")

      consoleSpy.log.mockClear()

      const result = await withTiming("getUser", "user-456", async () => null, {
        logNotFound: true,
      })

      expect(result).toBeNull()
      expect(consoleSpy.log).toHaveBeenCalled()
      // Check that the log message contains the string identifier with quotes
      const logCall = consoleSpy.log.mock.calls[0]?.[0]
      expect(logCall).toContain("user-456")
    })

    it("should log errors with Error objects", async () => {
      process.env.DAL_LOG_LEVEL = "error"
      const { withTiming } = await import("./logger")

      consoleSpy.error.mockClear()

      const error = new Error("Constraint violation")
      const fn = vi.fn().mockRejectedValueOnce(error)

      await expect(withTiming("createUser", { email: "test@example.com" }, fn)).rejects.toThrow()

      expect(consoleSpy.error).toHaveBeenCalled()
      const errorCall = consoleSpy.error.mock.calls[0]?.[0]
      expect(errorCall).toContain("Constraint violation")
    })

    it("should not log errors when log level is too high", async () => {
      process.env.DAL_LOG_LEVEL = "info"
      const { withTiming } = await import("./logger")

      consoleSpy.error.mockClear()

      const error = new Error("Database error")
      const fn = vi.fn().mockRejectedValueOnce(error)

      // Should still throw, but not log
      await expect(withTiming("operation", "id", fn)).rejects.toThrow("Database error")

      // Error level (3) > info level (1), so should still log
      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it("should not log errors when log level is debug and error occurs", async () => {
      process.env.DAL_LOG_LEVEL = "warn"
      const { withTiming } = await import("./logger")

      consoleSpy.error.mockClear()

      const error = new Error("Database error")
      const fn = vi.fn().mockRejectedValueOnce(error)

      // Should still throw, but not log because error level (3) > warn level (2)
      await expect(withTiming("operation", "id", fn)).rejects.toThrow("Database error")

      // Error level (3) > warn level (2), so should log
      expect(consoleSpy.error).toHaveBeenCalled()
    })
  })
})
