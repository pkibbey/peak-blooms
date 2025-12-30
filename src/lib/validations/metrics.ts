import { z } from "zod"
import { MetricType } from "@/generated/enums"

// Record metric schema
export const recordMetricSchema = z.object({
  type: z.enum([
    MetricType.SEED,
    MetricType.QUERY,
    MetricType.FETCH,
    MetricType.ADMIN_QUERY,
    MetricType.USER_QUERY,
  ]),
  name: z.string().min(1, "Metric name is required"),
  duration: z.number().positive("Duration must be positive"),
})

export type RecordMetricInput = z.infer<typeof recordMetricSchema>
