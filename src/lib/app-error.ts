import type { AppError } from "@/lib/query-types"

export function unauthorized(message = "Unauthorized"): AppError {
  return { success: false, error: message, code: "UNAUTHORIZED" }
}

export function forbidden(message = "Forbidden"): AppError {
  return { success: false, error: message, code: "FORBIDDEN" }
}

export function notFound(message = "Not found"): AppError {
  return { success: false, error: message, code: "NOT_FOUND" }
}

export function conflict(message = "Conflict"): AppError {
  return { success: false, error: message, code: "CONFLICT" }
}

export function validationError(
  message = "Invalid input",
  details?: Record<string, string | string[]>
): AppError {
  return { success: false, error: message, code: "VALIDATION_ERROR", details }
}

export function serverError(message = "Server error"): AppError {
  return { success: false, error: message, code: "SERVER_ERROR" }
}
