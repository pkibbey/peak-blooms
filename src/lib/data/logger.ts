/**
 * Data Access Layer Logger
 * Provides timing and caching observability for data operations
 */

type LogLevel = "debug" | "info" | "warn" | "error"

const LOG_LEVEL: LogLevel = (process.env.DAL_LOG_LEVEL as LogLevel) || "info"
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL]
}
/**
 * Log when an operation returns null (not found)
 */
function logNotFound(operation: string, identifier: string | Record<string, unknown>) {
  if (!shouldLog("debug")) return

  const timestamp = new Date().toISOString()
  const identifierStr =
    typeof identifier === "string" ? `"${identifier}"` : JSON.stringify(identifier)

  console.log(`[DAL] ${timestamp} | NOT_FOUND | ${operation}(${identifierStr})`)
}

/**
 * Log an error during data access
 */
function logError(operation: string, identifier: string | Record<string, unknown>, error: unknown) {
  if (!shouldLog("error")) return

  const timestamp = new Date().toISOString()
  const identifierStr =
    typeof identifier === "string" ? `"${identifier}"` : JSON.stringify(identifier)
  const errorMessage = error instanceof Error ? error.message : String(error)

  console.error(`[DAL] ${timestamp} | ERROR | ${operation}(${identifierStr}) - ${errorMessage}`)
}

/**
 * Utility to time an async operation
 */
export async function withTiming<T>(
  operation: string,
  identifier: string | Record<string, unknown>,
  fn: () => Promise<T>,
  options?: {
    logNotFound?: boolean
  }
): Promise<T> {
  try {
    const result = await fn()

    // Log not found if result is null and option is enabled
    if (result === null && options?.logNotFound) {
      logNotFound(operation, identifier)
    }

    return result
  } catch (error) {
    logError(operation, identifier, error)
    throw error
  }
}
