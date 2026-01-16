"use server"

import { ZodError } from "zod"
import type { Metric } from "@/generated/client"
import { getSession } from "@/lib/auth"
import { captureMetric, clearMetrics, getAllMetrics } from "@/lib/metrics"
import { type RecordMetricInput, recordMetricSchema } from "@/lib/validations/metrics"

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
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to fetch metrics")
  }
}

/**
 * Server action to record a new metric (admin only)
 */
export async function recordMetricAction(input: RecordMetricInput): Promise<void> {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    const { type, name, duration } = recordMetricSchema.parse(input)
    await captureMetric(type, name, duration)
  } catch (error) {
    // Check if it's a Zod validation error
    if (error instanceof ZodError) {
      throw new Error("Invalid metric data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to record metric")
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
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to clear metrics")
  }
}
