/**
 * Metrics Type Definitions
 * Centralized types for database metrics tracking
 */

export { MetricType } from "@/generated/enums"

export interface Metric {
  type: import("@/generated/enums").MetricType
  name: string
  duration: number
}

export interface MetricSummary {
  name: string
  count: number
  totalDuration: number
  averageDuration: number
}
