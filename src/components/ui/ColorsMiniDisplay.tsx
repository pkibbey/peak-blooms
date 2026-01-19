"use client"

import { COLOR_MAP } from "@/lib/colors"
import { cn } from "@/lib/utils"

interface ColorsMiniDisplayProps {
  colorIds?: string[] | null
  className?: string
  /**
   * Maximum number of colors to display before showing a count
   * @default 5
   */
  maxDisplay?: number
  size?: "sm" | "md"
}

/**
 * Renders a compact display of color swatches as tiny circles.
 * Used on product cards and table rows.
 * Translates color IDs to hex values using the COLOR_MAP registry.
 */
export function ColorsMiniDisplay({
  colorIds,
  className = "",
  maxDisplay = 5,
  size = "sm",
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
          const color = COLOR_MAP.get(colorId)
          return (
            <div
              key={colorId}
              role="img"
              aria-label={color?.label || colorId}
              title={color?.label || colorId}
              className={cn(
                "rounded-full border border-border",
                size === "sm" && "w-4 h-4",
                size === "md" && "w-6 h-6"
              )}
              style={{ backgroundColor: color?.hex || "#000000" }}
            />
          )
        })}
      </div>
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">+{remainingCount}</span>
      )}
      <span className="sr-only">
        Colors: {displayedColors.map((id) => COLOR_MAP.get(id)?.label || id).join(", ")}
        {remainingCount > 0 && ` and ${remainingCount} more`}
      </span>
    </div>
  )
}
