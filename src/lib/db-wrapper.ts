/**
 * Database Client Wrapper
 * Provides transparent database operation tracking with timing and categorization.
 * Metrics are captured only in development mode.
 */

import type { PrismaClient } from "@/generated/client"
import type { MetricType } from "@/generated/enums"
import { captureSeedMetric } from "@/lib/metrics"

/**
 * Creates a wrapped Prisma client that tracks database operations.
 * @param baseDb - The base Prisma client to wrap
 * @param metricType - The metric type to record (ADMIN_QUERY or USER_QUERY)
 * @returns A proxy client that captures timing metrics
 */
export function createTrackedDb(
  baseDb: PrismaClient,
  metricType: "ADMIN_QUERY" | "USER_QUERY"
): PrismaClient {
  return new Proxy(baseDb, {
    get(target, prop) {
      const value = Reflect.get(target, prop)

      // Skip wrapping for metric model to avoid tracking metric writes themselves
      if (prop === "metric") {
        return value
      }

      // Only wrap model methods (not special properties like $transaction, $disconnect, etc.)
      if (typeof value === "object" && value !== null && !prop.toString().startsWith("$")) {
        // This is a model namespace (e.g., db.user, db.product)
        return new Proxy(value, {
          get(modelTarget, method) {
            const modelMethod = Reflect.get(modelTarget, method)

            // Only wrap query methods
            if (
              typeof modelMethod === "function" &&
              [
                "findMany",
                "findUnique",
                "findFirst",
                "create",
                "update",
                "upsert",
                "delete",
                "deleteMany",
                "updateMany",
                "count",
                "aggregate",
                "groupBy",
              ].includes(method.toString())
            ) {
              return async (...args: unknown[]) => {
                const startTime = performance.now()
                try {
                  const result = await modelMethod.apply(modelTarget, args)

                  // Only capture metrics in development
                  if (process.env.NODE_ENV === "development") {
                    const duration = performance.now() - startTime
                    const operationName = `${String(prop)}.${String(method)}`
                    // Fire and forget - don't await to avoid slowing down queries
                    captureSeedMetric(metricType as MetricType, operationName, duration)
                  }

                  return result
                } catch (error) {
                  // Still track failed queries for debugging
                  if (process.env.NODE_ENV === "development") {
                    const duration = performance.now() - startTime
                    const operationName = `${String(prop)}.${String(method)} (error)`
                    // Fire and forget
                    captureSeedMetric(metricType as MetricType, operationName, duration)
                  }
                  throw error
                }
              }
            }

            return modelMethod
          },
        })
      }

      return value
    },
  }) as PrismaClient
}
