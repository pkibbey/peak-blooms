/**
 * Metrics Utility
 * In-memory metrics storage and capture functionality
 */

import type { Metric, MetricType } from "@/lib/types/metrics"

// In-memory storage for metrics
const metricsStore: Metric[] = []

/**
 * Capture a metric by recording its type, name, and duration
 * @param type - The type of metric (SEED, QUERY, FETCH, etc.)
 * @param name - A descriptive name for this metric
 * @param duration - The duration in milliseconds
 */
export function captureMetric(type: MetricType, name: string, duration: number): void {
  console.log("captureMetric: ", name)
  metricsStore.push({
    type,
    name,
    duration,
  })
}

/**
 * Get all recorded metrics
 */
export function getAllMetrics(): Metric[] {
  return [...metricsStore]
}

/**
 * Clear all recorded metrics
 */
export function clearMetrics(): void {
  metricsStore.length = 0
}

/**
 * Get metrics filtered by types
 */
export function getMetricsByTypes(types: MetricType[]): Metric[] {
  return metricsStore.filter((metric) => types.includes(metric.type))
}
