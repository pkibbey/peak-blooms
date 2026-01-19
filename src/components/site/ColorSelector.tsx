"use client"

import { COLOR_IDS, COLOR_MAP } from "@/lib/colors"
import { cn } from "@/lib/utils"

interface ColorSelectorProps {
  selectedColors: string[]
  onChange: (colors: string[]) => void
  showLabel?: boolean
  compact?: boolean
}

export function ColorSelector({
  selectedColors,
  onChange,
  showLabel = true,
  compact = false,
}: ColorSelectorProps) {
  const handleColorClick = (colorId: string) => {
    const updated = selectedColors.includes(colorId)
      ? selectedColors.filter((c) => c !== colorId)
      : [...selectedColors, colorId]
    onChange(updated)
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <div className="flex flex-col gap-2">
      {showLabel && <span className="text-sm font-medium">Colors</span>}
      <div className={cn("flex flex-wrap gap-2", compact && "gap-1")}>
        {COLOR_IDS.map((colorId) => {
          const color = COLOR_MAP.get(colorId)
          if (!color) return null
          const isActive = selectedColors.includes(colorId)
          return (
            <button
              key={colorId}
              type="button"
              aria-label={color.label}
              title={color.label}
              onClick={() => handleColorClick(colorId)}
              className={cn(
                "rounded-full border-2 transition-shadow focus:outline-none",
                compact ? "h-6 w-6" : "h-8 w-8",
                isActive ? "ring-2 ring-offset-1 ring-primary" : "border-border"
              )}
              style={{ backgroundColor: color.hex }}
            />
          )
        })}
        {/* Clear button */}
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            "rounded-md border flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors",
            compact ? "h-6 px-1.5" : "h-8 px-2"
          )}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
