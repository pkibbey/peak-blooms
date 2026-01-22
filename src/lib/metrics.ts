/**
 * Metrics Utility
 * Database-backed metrics storage and capture functionality
 */

import type { Metric } from "@/generated/client"
import type { MetricType } from "@/generated/enums"
import { db } from "@/lib/db"
import { toAppError } from "./error-utils"

/**
 * Capture a metric by recording its type, name, and duration
 * @param type - The type of metric (SEED, QUERY, FETCH, etc.)
 * @param name - A descriptive name for this metric
 * @param duration - The duration in milliseconds
 */
export async function captureMetric(
  type: MetricType,
  name: string,
  duration: number
): Promise<void> {
  try {
    await db.metric.create({
      data: {
        type,
        name,
        duration,
      },
    })
  } catch (error) {
    toAppError(error, "Failed to save metric")
  }
}

/**
 * Get all recorded metrics
 */
export async function getAllMetrics(): Promise<Metric[]> {
  try {
    return await db.metric.findMany({
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    toAppError(error, "Failed to fetch metrics")
    return []
  }
}

/**
 * Clear all recorded metrics
 */
export async function clearMetrics(): Promise<void> {
  try {
    await db.metric.deleteMany({})
  } catch (error) {
    toAppError(error, "Failed to clear metrics")
  }
}
