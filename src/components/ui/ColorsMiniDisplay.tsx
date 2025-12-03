"use client"

import { COLORS } from "@/lib/colors"

interface ColorsMiniDisplayProps {
  colorIds?: string[] | null
  className?: string
  /**
   * Maximum number of colors to display before showing a count
   * @default 5
   */
  maxDisplay?: number
}

/**
 * Renders a compact display of color swatches as tiny circles.
 * Used on product cards and table rows.
 * Translates color IDs to hex values using the COLORS registry.
 */
export function ColorsMiniDisplay({
  colorIds,
  className = "",
  maxDisplay = 5,
}: ColorsMiniDisplayProps) {
  if (!colorIds || colorIds.length === 0) {
    return <span className="text-muted-foreground text-xs">No colors</span>
  }

  const displayedColors = colorIds.slice(0, maxDisplay)
  const remainingCount = colorIds.length - maxDisplay

  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <div className="flex -space-x-1">
        {displayedColors.map((colorId) => {
          const color = COLORS.find((c) => c.id === colorId)
          return (
            <div
              key={colorId}
              role="img"
              aria-label={color?.label || colorId}
              title={color?.label || colorId}
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: color?.hex || "#000000" }}
            />
          )
        })}
      </div>
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">+{remainingCount}</span>
      )}
      <span className="sr-only">
        Colors:{" "}
        {displayedColors.map((id) => COLORS.find((c) => c.id === id)?.label || id).join(", ")}
        {remainingCount > 0 && ` and ${remainingCount} more`}
      </span>
    </div>
  )
}
