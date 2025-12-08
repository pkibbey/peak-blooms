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

      <div className="space-y-12">
        <div>
          <h2 className="heading-2 mb-4">Admin Database Queries</h2>
          <MetricsClient types={[MetricType.ADMIN_QUERY]} />
        </div>

        <div>
          <h2 className="heading-2 mb-4">User Database Queries</h2>
          <MetricsClient types={[MetricType.USER_QUERY]} />
        </div>

        <div>
          <h2 className="heading-2 mb-4">Seed Operations</h2>
          <MetricsClient types={[MetricType.SEED]} />
        </div>
      </div>
    </>
  )
}
