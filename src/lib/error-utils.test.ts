import { describe, expect, it } from "vitest"
import { ZodError, z } from "zod"
import { toAppError } from "@/lib/error-utils"

describe("toAppError", () => {
  it("converts ZodError to VALIDATION_ERROR with details", () => {
    const schema = z.object({ name: z.string().min(1) })
    let caught: unknown

    try {
      schema.parse({})
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(ZodError)

    const appErr = toAppError(caught)
    expect(appErr.success).toBe(false)
    expect(appErr.code).toBe("VALIDATION_ERROR")
    expect(appErr.error).toContain("name")
    expect(appErr.details).toBeTruthy()
    expect(typeof appErr.details).toBe("object")
    // details should include name as an array of messages
    expect(Array.isArray((appErr.details as Record<string, string[]>).name)).toBe(true)
  })

  it("maps 'Unauthorized' message to UNAUTHORIZED", () => {
    const err = new Error("Unauthorized: missing token")
    const appErr = toAppError(err)
    expect(appErr.code).toBe("UNAUTHORIZED")
  })

  it("maps 'Forbidden' message to FORBIDDEN", () => {
    const err = new Error("Forbidden: invalid scope")
    const appErr = toAppError(err)
    expect(appErr.code).toBe("FORBIDDEN")
  })

  it("maps 'not found' message to NOT_FOUND", () => {
    const err = new Error("Resource not found: id=123")
    const appErr = toAppError(err)
    expect(appErr.code).toBe("NOT_FOUND")
  })

  it("maps 'already exists' message to CONFLICT", () => {
    const err = new Error("User already exists with that email")
    const appErr = toAppError(err)
    expect(appErr.code).toBe("CONFLICT")
  })

  it("maps generic Error to SERVER_ERROR", () => {
    const err = new Error("Something bad happened")
    const appErr = toAppError(err)
    expect(appErr.code).toBe("SERVER_ERROR")
    expect(appErr.error).toBe("Something bad happened")
  })

  it("maps string error to SERVER_ERROR with the string message", () => {
    const appErr = toAppError("plain string error")
    expect(appErr.code).toBe("SERVER_ERROR")
    expect(appErr.error).toBe("plain string error")
  })

  it("maps unknown non-error values to SERVER_ERROR with default message", () => {
    const appErr = toAppError({ foo: "bar" } as unknown)
    expect(appErr.code).toBe("SERVER_ERROR")
    expect(appErr.error).toBe("An unexpected error occurred")
  })
})
