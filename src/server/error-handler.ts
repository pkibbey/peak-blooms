/** biome-ignore-all lint/suspicious/noExplicitAny: error handler */
import { toAppError } from "@/lib/error-utils"
import type { AppError, AppResult } from "@/lib/query-types"

function statusFromCode(code: string | undefined): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401
    case "FORBIDDEN":
      return 403
    case "NOT_FOUND":
      return 404
    case "VALIDATION_ERROR":
    case "INVALID_INPUT":
      return 400
    case "CONFLICT":
      return 409
    default:
      return 500
  }
}

export function wrapRoute(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (err) {
      const appErr = toAppError(err, "Internal server error")
      const status = statusFromCode(appErr.code)

      return Response.json({ success: false, code: appErr.code, error: appErr.error }, { status })
    }
  }
}

export function wrapAction<T extends unknown[], R>(handler: (...args: T) => Promise<R>) {
  return async (
    ...args: T
  ): Promise<(R extends AppResult<infer R> ? R : AppResult<R>) | AppError> => {
    try {
      const result = await handler(...args)

      if (
        result &&
        typeof result === "object" &&
        "success" in (result as any) &&
        typeof (result as any).success === "boolean"
      ) {
        return result as any
      }

      return { success: true, data: result } as any
    } catch (err) {
      return toAppError(err, "Internal server error")
    }
  }
}
