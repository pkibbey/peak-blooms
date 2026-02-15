"use client"

import { format } from "date-fns"
import React from "react"
import { formatPrice } from "@/lib/utils"

type PriceHistoryItem = {
  id: string
  previousPrice: number
  newPrice: number
  changedAt: string // ISO
  changedByUser?: { id: string | null; name?: string | null; email?: string | null } | null
}

export function AdminProductPriceHistory({
  history,
  currentPrice,
}: {
  history: PriceHistoryItem[]
  currentPrice?: number
}) {
  const points = React.useMemo(() => {
    // Order oldest -> newest for charting
    return [...history].reverse()
  }, [history])

  // Build corresponding dates for each plotted point. Use the oldest history item's changedAt as the start.
  const seriesDates = React.useMemo(() => {
    if (!points || points.length === 0) return []
    return [new Date(points[0].changedAt), ...points.map((p) => new Date(p.changedAt))]
  }, [points])

  // Tooltip state for point hover (client-side only)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [tooltip, setTooltip] = React.useState<
    { visible: false } | { visible: true; x: number; y: number; content: string }
  >({ visible: false })

  const showTooltip = (e: React.MouseEvent<SVGElement, MouseEvent>, content: string) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setTooltip({ visible: true, x, y, content })
  }
  const hideTooltip = () => setTooltip({ visible: false })

  // If there's no recorded history yet, show a helpful placeholder that still
  // surfaces the current price so admins can see price context immediately.
  if (!history || history.length === 0) {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-muted-foreground">Price history</div>
          <div className="text-sm font-medium">Latest: ${currentPrice?.toFixed(2) ?? "0.00"}</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-sm text-muted-foreground mb-2">No historical price changes yet.</div>
          <div className="text-lg font-semibold">
            Current price: ${currentPrice?.toFixed(2) ?? "0.00"}
          </div>
        </div>
      </div>
    )
  }

  // Build a plotted series that includes the starting price (previousPrice of the oldest entry)
  const startingPrice = points[0].previousPrice ?? points[0].newPrice ?? currentPrice ?? 0
  const seriesPrices = [startingPrice, ...points.map((p) => p.newPrice)]
  const latestPrice = seriesPrices[seriesPrices.length - 1] ?? currentPrice ?? seriesPrices[0]

  const values = [...seriesPrices, ...points.flatMap((p) => [p.previousPrice, p.newPrice])]
  const min = Math.min(...values, currentPrice ?? Infinity)
  const max = Math.max(...values, currentPrice ?? -Infinity)
  const padding = (max - min) * 0.12 || 1
  const chartMin = Math.max(0, min - padding)
  const chartMax = max + padding

  const totalWidth = 480
  const labelWidth = 60
  const chartWidth = totalWidth - labelWidth
  const chartHeight = 120
  const topPadding = 10 // extra spacing at top so glyphs/markers don't touch the svg edge
  const bottomAxisHeight = 36 // increased space for date labels
  const svgHeight = chartHeight + bottomAxisHeight + topPadding
  const seriesCount = seriesPrices.length
  const stepX = seriesCount > 1 ? chartWidth / (seriesCount - 1) : chartWidth / 2
  const hitPadding = 8 // extra radius added to each mark for larger hit area (adds 16px to diameter)

  const mapY = (v: number) => {
    const ratio = (v - chartMin) / (chartMax - chartMin || 1)
    return topPadding + (chartHeight - ratio * chartHeight)
  }

  // Y-axis tick values (5 ticks including min/max)
  const ticks: number[] = [0, 0.25, 0.5, 0.75, 1].map((t) => chartMin + t * (chartMax - chartMin))

  // X-axis: choose up to 5 evenly spaced tick indices across the series
  const xTickCount = Math.min(5, seriesCount)
  const xTickIndices = Array.from({ length: xTickCount }, (_, i) =>
    Math.round((i * (seriesCount - 1)) / (xTickCount - 1 || 1))
  )

  const dateRangeDays =
    (seriesDates[seriesDates.length - 1].getTime() - seriesDates[0].getTime()) /
    (1000 * 60 * 60 * 24)
  const dateFormat = dateRangeDays > 365 ? "MMM yyyy" : "MMM d"

  // Use the seriesPrices (includes starting price) as the plotted series
  const pathD = seriesPrices
    .map((price, i) => {
      const x = Math.round(labelWidth + i * stepX)
      const y = Math.round(mapY(price))
      return `${i === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground">Price history</div>
        <div className="text-sm font-medium">Latest: ${latestPrice.toFixed(2)}</div>
      </div>

      <div className="rounded-lg border border-border p-3" ref={containerRef}>
        <svg
          width={totalWidth}
          height={svgHeight}
          className="block mx-auto"
          role="img"
          aria-label="Product price history chart"
        >
          <title>Price history chart</title>
          {/* grid lines + Y-axis labels */}
          <defs>
            <linearGradient id="pb" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-axis tick labels and small tick marks */}
          {ticks.map((tick) => (
            <g key={tick}>
              <text
                x={8}
                y={Math.round(mapY(tick))}
                fill="#6b7280"
                fontSize={11}
                dominantBaseline="middle"
              >
                {formatPrice(tick)}
              </text>
              <line
                x1={labelWidth - 6}
                x2={labelWidth}
                y1={Math.round(mapY(tick))}
                y2={Math.round(mapY(tick))}
                stroke="#e6e9ee"
                strokeWidth={1}
                opacity={0.6}
              />
            </g>
          ))}

          {/* horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={labelWidth}
              x2={totalWidth}
              y1={topPadding + t * chartHeight}
              y2={topPadding + t * chartHeight}
              stroke="#e6e9ee"
              strokeWidth={1}
              opacity={0.6}
            />
          ))}

          {/* area under line */}
          <path
            d={`${pathD} L ${totalWidth} ${topPadding + chartHeight} L ${labelWidth} ${topPadding + chartHeight} Z`}
            fill="url(#pb)"
            opacity={0.9}
          />

          {/* price line */}
          <path
            d={pathD}
            fill="none"
            stroke="#059669"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* dots (first dot = starting price) */}
          {seriesPrices.map((price, i) => {
            const x = Math.round(labelWidth + i * stepX)
            const y = Math.round(mapY(price))
            const isStart = i === 0
            const date = seriesDates[i]
            const dateLabel = date ? ` — ${format(date, "MMM d, yyyy HH:mm")}` : ""
            const titleText = `${isStart ? "Start: " : ""}${formatPrice(price)}${dateLabel}`

            return (
              <g
                key={`s-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: Index is fine for now
                  i
                }`}
                onMouseEnter={(e) => showTooltip(e, titleText)}
                onMouseMove={(e) => showTooltip(e, titleText)}
                onMouseLeave={hideTooltip}
                tabIndex={0}
                onFocus={(e) => {
                  // position tooltip near the focused element for keyboard users
                  const targetRect = (e.target as Element).getBoundingClientRect()
                  const containerRect = containerRef.current?.getBoundingClientRect()
                  if (!containerRect) return
                  setTooltip({
                    visible: true,
                    x: targetRect.left + targetRect.width / 2 - containerRect.left,
                    y: targetRect.top - containerRect.top,
                    content: titleText,
                  })
                }}
                onBlur={hideTooltip}
              >
                {/* invisible larger hit area for easier hovering */}
                <circle
                  cx={x}
                  cy={y}
                  r={(isStart ? 4 : 3.25) + hitPadding}
                  fill="transparent"
                  className="cursor-pointer"
                />

                <circle
                  cx={x}
                  cy={y}
                  r={isStart ? 4 : 3.25}
                  fill={isStart ? "#0ea5a4" : "#064e3b"}
                  stroke="#fff"
                  strokeWidth={1}
                />

                <title>{titleText}</title>
              </g>
            )
          })}

          {/* X-axis date labels */}
          {xTickIndices.map((idx) => {
            const x = Math.round(labelWidth + idx * stepX)
            return (
              <text
                key={`x-${idx}`}
                x={x}
                y={topPadding + chartHeight + bottomAxisHeight / 2}
                fill="#6b7280"
                fontSize={11}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {format(seriesDates[idx], dateFormat)}
              </text>
            )
          })}
        </svg>

        {/* floating tooltip (client-side) */}
        {tooltip.visible && (
          <div
            aria-live="polite"
            className="absolute z-50 pointer-events-none bg-popover text-popover-foreground rounded px-2 py-1 text-sm shadow-lg"
            style={{
              left: tooltip.x,
              top: Math.max(8, tooltip.y - 12),
              transform: "translate(-50%, -100%)",
              whiteSpace: "nowrap",
            }}
          >
            {tooltip.content}
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-2">Recent changes</div>
            <ul className="text-sm space-y-2">
              {history.slice(0, 6).map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <div className="font-medium">
                      ${h.previousPrice.toFixed(2)} → ${h.newPrice.toFixed(2)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {format(new Date(h.changedAt), "MMM d, yyyy HH:mm")}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {h.changedByUser?.name ?? h.changedByUser?.email ?? "—"}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-2">Summary</div>
            <div className="text-sm">
              <div>
                Changes: <strong>{history.length}</strong>
              </div>
              <div>
                From: <strong>{formatPrice(seriesPrices[0])}</strong>
              </div>
              <div>
                To: <strong>{formatPrice(seriesPrices[seriesPrices.length - 1])}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
