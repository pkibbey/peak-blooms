import MetricsClient from "@/components/admin/MetricsClient"
import { MetricType } from "@/lib/types/metrics"

export const metadata = {
  title: "Seed Metrics - Admin",
  description: "Monitor database queries during seed script execution",
}

export default function SeedMetricsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="heading-1">Seed Metrics</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor database queries executed during the seed script. Use the controls below to start
          tracking, run your seed script, then stop tracking to analyze performance.
        </p>
      </div>

      <MetricsClient types={[MetricType.SEED]} />
    </>
  )
}
