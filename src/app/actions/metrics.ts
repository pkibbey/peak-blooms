"use server"

import { getSession } from "@/lib/auth"
import { captureMetric, clearMetrics, getAllMetrics } from "@/lib/metrics"
import type { Metric, MetricType } from "@/lib/types/metrics"

/**
 * Server action to get all recorded metrics (admin only)
 */
export async function getMetricsAction(): Promise<Metric[]> {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    return await getAllMetrics()
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to fetch metrics")
  }
}

/**
 * Server action to record a new metric (admin only)
 */
async function recordMetricAction(type: MetricType, name: string, duration: number): Promise<void> {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    if (!type || !name || typeof duration !== "number") {
      throw new Error("Invalid metric data")
    }

    await captureMetric(type, name, duration)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to record metric")
  }
}

/**
 * Server action to clear all metrics (admin only)
 */
export async function clearMetricsAction(): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    await clearMetrics()
    return { success: true, message: "All metrics cleared" }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to clear metrics")
  }
}
