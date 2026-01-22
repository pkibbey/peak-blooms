import { toAppError } from "@/lib/error-utils"
import type { AppError } from "@/lib/query-types"

function statusFromCode(code: string | undefined): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401
    case "FORBIDDEN":
      return 403
    case "NOT_FOUND":
      return 404
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
  return async (...args: T): Promise<R | AppError> => {
    try {
      return await handler(...args)
    } catch (err) {
      return toAppError(err, "Internal server error")
    }
  }
}
