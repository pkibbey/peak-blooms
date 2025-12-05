import MetricsClient from "@/components/admin/MetricsClient"
import { MetricType } from "@/lib/types/metrics"

export const metadata = {
  title: "Database Metrics - Admin",
  description: "Monitor database query performance and operations",
}

export default function MetricsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="heading-1">Database Metrics</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor database queries, identify bottlenecks, and optimize performance. Metrics are
          collected in development mode only.
        </p>
      </div>

      <MetricsClient types={[MetricType.QUERY]} />
    </>
  )
}
