interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
}

export default function ChartSparkline({
  data,
  width = 140,
  height = 32,
  color = "#7c3aed",
}: SparklineProps) {
  if (!data || data.length === 0) {
    return <div className="h-8 w-36 bg-muted rounded-sm" />
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  // Build points for a polyline
  const step = width / (data.length - 1)
  const points = data
    .map((v, i) => {
      const x = Math.round(i * step)
      // invert y because SVG y=0 is the top
      const y = Math.round(height - ((v - min) / range) * height)
      return `${x},${y}`
    })
    .join(" ")

  // min/max dots (small) — render as circles for first and last
  const first = data[0]
  const last = data[data.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      role="img"
      aria-hidden={false}
    >
      <title>Sparkline</title>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* small marker for first and last */}
      <circle
        cx={0}
        cy={Math.round(height - ((first - min) / range) * height)}
        r={2}
        fill={color}
      />
      <circle
        cx={width}
        cy={Math.round(height - ((last - min) / range) * height)}
        r={2}
        fill={color}
      />
    </svg>
  )
}
