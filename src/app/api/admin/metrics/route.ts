import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { captureMetric, clearMetrics, getAllMetrics } from "@/lib/metrics"
import type { MetricType } from "@/lib/types/metrics"

/**
 * GET /api/admin/metrics
 * Get all recorded metrics (admin only)
 */
export async function GET() {
  try {
    const session = await getSession()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const metrics = getAllMetrics()
    return NextResponse.json(metrics)
  } catch (error) {
    console.error("GET /api/admin/metrics error:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}

/**
 * POST /api/admin/metrics
 * Record a new metric (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, name, duration } = body as {
      type: MetricType
      name: string
      duration: number
    }

    if (!type || !name || typeof duration !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid required fields: type, name, duration" },
        { status: 400 }
      )
    }

    captureMetric(type, name, duration)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/admin/metrics error:", error)
    return NextResponse.json({ error: "Failed to record metric" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/metrics
 * Clear all metrics (admin only)
 */
export async function DELETE() {
  try {
    const session = await getSession()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    clearMetrics()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/admin/metrics error:", error)
    return NextResponse.json({ error: "Failed to clear metrics" }, { status: 500 })
  }
}
