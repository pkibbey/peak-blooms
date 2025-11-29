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

function formatDuration(ms: number): string {
  if (ms < 1) return "<1ms"
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Log a data access operation with timing information
 */
export function logDataAccess(
  operation: string,
  identifier: string | Record<string, unknown>,
  durationMs: number,
  options?: {
    cached?: boolean
    resultCount?: number
    level?: LogLevel
  }
) {
  const level = options?.level ?? "info"
  if (!shouldLog(level)) return

  const timestamp = new Date().toISOString()
  const identifierStr =
    typeof identifier === "string" ? `"${identifier}"` : JSON.stringify(identifier)
  const duration = formatDuration(durationMs)
  const cacheStatus = options?.cached ? "CACHED" : "DB"
  const resultInfo = options?.resultCount !== undefined ? ` (${options.resultCount} results)` : ""

  console.log(
    `[DAL] ${timestamp} | ${cacheStatus} | ${operation}(${identifierStr}) - ${duration}${resultInfo}`
  )
}

/**
 * Log when an operation returns null (not found)
 */
export function logNotFound(operation: string, identifier: string | Record<string, unknown>) {
  if (!shouldLog("debug")) return

  const timestamp = new Date().toISOString()
  const identifierStr =
    typeof identifier === "string" ? `"${identifier}"` : JSON.stringify(identifier)

  console.log(`[DAL] ${timestamp} | NOT_FOUND | ${operation}(${identifierStr})`)
}

/**
 * Log an error during data access
 */
export function logError(
  operation: string,
  identifier: string | Record<string, unknown>,
  error: unknown
) {
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
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start

    // Determine result count for arrays
    const resultCount = Array.isArray(result) ? result.length : undefined

    // Log not found if result is null and option is enabled
    if (result === null && options?.logNotFound) {
      logNotFound(operation, identifier)
    } else {
      logDataAccess(operation, identifier, duration, { resultCount })
    }

    return result
  } catch (error) {
    logError(operation, identifier, error)
    throw error
  }
}
