/**
 * Metrics Type Definitions
 * Centralized types for database metrics tracking
 */

export enum MetricType {
  SEED = "SEED",
  QUERY = "QUERY",
  FETCH = "FETCH",
}

export interface Metric {
  type: MetricType
  name: string
  duration: number
}

export interface MetricSummary {
  name: string
  count: number
  totalDuration: number
  averageDuration: number
}
