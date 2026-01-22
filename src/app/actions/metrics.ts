"use server"

import { getSession } from "@/lib/auth"
import { clearMetrics, getAllMetrics } from "@/lib/metrics"
import type { Metric } from "@/lib/query-types"
import { wrapAction } from "@/server/error-handler"

/**
 * Server action to get all recorded metrics (admin only)
 */
export const getMetricsAction = wrapAction(async (): Promise<Metric[]> => {
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: You must be an admin to view metrics")
  }

  const metrics = await getAllMetrics()
  return metrics
})

/**
 * Server action to clear all metrics (admin only)
 */
export const clearMetricsAction = wrapAction(async (): Promise<{ message: string }> => {
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: You must be an admin to clear metrics")
  }

  await clearMetrics()
  return { message: "All metrics cleared" }
})
