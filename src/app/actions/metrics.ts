"use server"

import { getSession } from "@/lib/auth"
import { toAppError } from "@/lib/error-utils"
import { captureMetric, clearMetrics, getAllMetrics } from "@/lib/metrics"
import type { AppResult, Metric } from "@/lib/query-types"
import { type RecordMetricInput, recordMetricSchema } from "@/lib/validations/metrics"

/**
 * Server action to get all recorded metrics (admin only)
 */
export async function getMetricsAction(): Promise<AppResult<Metric[]>> {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be an admin to view metrics",
        code: "UNAUTHORIZED",
      }
    }

    const metrics = await getAllMetrics()
    return {
      success: true,
      data: metrics,
    }
  } catch (error) {
    return toAppError(error, "Failed to fetch metrics")
  }
}

/**
 * Server action to record a new metric (admin only)
 */
export async function recordMetricAction(input: RecordMetricInput): Promise<AppResult<void>> {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be an admin to record metrics",
        code: "UNAUTHORIZED",
      }
    }

    const { type, name, duration } = recordMetricSchema.parse(input)
    await captureMetric(type, name, duration)

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    return toAppError(error, "Failed to record metric")
  }
}

/**
 * Server action to clear all metrics (admin only)
 */
export async function clearMetricsAction(): Promise<
  AppResult<{ success: boolean; message: string }>
> {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be an admin to clear metrics",
        code: "UNAUTHORIZED",
      }
    }

    await clearMetrics()
    return {
      success: true,
      data: { success: true, message: "All metrics cleared" },
    }
  } catch (error) {
    return toAppError(error, "Failed to clear metrics")
  }
}
