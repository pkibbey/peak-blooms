"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { clearMetricsAction, getMetricsAction } from "@/app/actions/metrics"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Metric, MetricSummary, MetricType } from "@/lib/types/metrics"

interface MetricsClientProps {
  types: MetricType[]
}

export default function MetricsClient({ types }: MetricsClientProps) {
  const [summaries, setSummaries] = useState<MetricSummary[]>([])
  const [isClearing, setIsClearing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Totals for the table footer
  const totalCount = summaries.reduce((sum, s) => sum + s.count, 0)
  const totalDuration = summaries.reduce((sum, s) => sum + s.totalDuration, 0)
  const averageOfAverages =
    summaries.length > 0
      ? summaries.reduce((sum, s) => sum + s.averageDuration, 0) / summaries.length
      : 0

  // Clear all metrics
  const handleClearMetrics = async () => {
    try {
      setIsClearing(true)
      await clearMetricsAction()
      setSummaries([])
      toast.success("Metrics cleared")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to clear metrics")
      console.error("Failed to clear metrics:", error)
    } finally {
      setIsClearing(false)
    }
  }

  // Fetch metrics on mount
  useEffect(() => {
    // Calculate summaries by metric name
    const calculateSummaries = (allMetrics: Metric[]) => {
      const metricsToShow = types ? allMetrics.filter((m) => types.includes(m.type)) : allMetrics

      const summaryMap = new Map<string, MetricSummary>()

      metricsToShow.forEach((metric) => {
        const existing = summaryMap.get(metric.name)
        if (existing) {
          existing.count += 1
          existing.totalDuration += metric.duration
        } else {
          summaryMap.set(metric.name, {
            name: metric.name,
            count: 1,
            totalDuration: metric.duration,
            averageDuration: metric.duration,
          })
        }
      })

      // Calculate averages
      summaryMap.forEach((summary) => {
        summary.averageDuration = summary.totalDuration / summary.count
      })

      setSummaries(Array.from(summaryMap.values()).sort((a, b) => a.name.localeCompare(b.name)))
    }

    // Fetch metrics from server action
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        const data = await getMetricsAction()
        calculateSummaries(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to fetch metrics")
        console.error("Failed to fetch metrics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [types])

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Button
          onClick={handleClearMetrics}
          disabled={isClearing || isLoading}
          variant="outline-destructive"
        >
          {isClearing ? "Clearing..." : "Clear Metrics"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading metrics...</p>
        </div>
      ) : summaries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No metrics recorded yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Metrics will appear here as they are captured.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Total Duration (ms)</TableHead>
              <TableHead className="text-right">Average Duration (ms)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.map((summary) => (
              <TableRow key={summary.name}>
                <TableCell className="font-medium">{summary.name}</TableCell>
                <TableCell className="text-right">{summary.count}</TableCell>
                <TableCell className="text-right">{summary.totalDuration.toFixed(2)}</TableCell>
                <TableCell className="text-right">{summary.averageDuration.toFixed(2)}</TableCell>
              </TableRow>
            ))}

            {/* Totals row */}
            <TableRow key="totals" className="border-t">
              <TableCell className="font-semibold">Totals</TableCell>
              <TableCell className="text-right font-semibold">{totalCount}</TableCell>
              <TableCell className="text-right font-semibold">{totalDuration.toFixed(2)}</TableCell>
              <TableCell className="text-right font-semibold">
                {averageOfAverages.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  )
}
