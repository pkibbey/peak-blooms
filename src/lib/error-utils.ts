/**
 * Error Handling Utilities
 *
 * Provides type-safe error handling, formatting, and conversion for consistent
 * error patterns across server actions and API routes.
 */

import { ZodError } from "zod"
import type { AppError } from "@/lib/query-types"

/**
 * Type guard: Check if error is a ZodError
 * Use to safely handle validation errors in catch blocks
 */
function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError
}

/**
 * Type guard: Check if error is an Error object
 * Use to safely extract message from caught exceptions
 */
function isErrorObject(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Extract message from any error type
 * Returns a safe error message string for any error value
 *
 * @param error - The error to extract a message from
 * @returns A safe error message string
 */
function getErrorMessage(error: unknown): string {
  if (isErrorObject(error)) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message)
  }
  return "An unexpected error occurred"
}

/**
 * Convert any error to a structured AppError
 * Use in server action catch blocks to return consistent error responses
 *
 * @param error - The error to convert
 * @param defaultMessage - Default message if error type is unknown
 * @returns AppError object for structured error handling
 */
export function toAppError(
  error: unknown,
  defaultMessage: string = "An unexpected error occurred"
): AppError {
  if (isZodError(error)) {
    // Extract first validation error for brief message
    const firstIssue = error.issues[0]
    const message = firstIssue
      ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
      : "Validation failed"

    return {
      success: false,
      error: message,
      code: "VALIDATION_ERROR",
      details: error.flatten().fieldErrors as Record<string, string | string[]>,
    }
  }

  if (isErrorObject(error)) {
    // Try to extract structured error info if available
    const message = error.message || defaultMessage

    // Check for specific error patterns
    if (message.includes("Unauthorized")) {
      return { success: false, error: message, code: "UNAUTHORIZED" }
    }
    if (message.includes("Forbidden")) {
      return { success: false, error: message, code: "FORBIDDEN" }
    }
    if (message.includes("not found")) {
      return { success: false, error: message, code: "NOT_FOUND" }
    }
    if (message.includes("already exists")) {
      return { success: false, error: message, code: "CONFLICT" }
    }

    return { success: false, error: message, code: "SERVER_ERROR" }
  }

  const message = typeof error === "string" ? error : defaultMessage

  return {
    success: false,
    error: message,
    code: "SERVER_ERROR",
  }
}

/**
 * Safe JSON parse with error handling
 * Returns null if parsing fails, parsed value on success
 *
 * @param json - JSON string to parse
 * @returns Parsed object or null if invalid
 */
function safeJsonParse<T = unknown>(json: string): T | null {
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

/**
 * Safe JSON stringify with error handling
 * Returns empty string if stringification fails
 *
 * @param value - Value to stringify
 * @returns JSON string or empty string if fails
 */
function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return ""
  }
}
