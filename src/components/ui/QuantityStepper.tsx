"use client"

import { Button } from "@/components/ui/button"
import { IconMinus, IconPlus } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface QuantityStepperProps {
  value: number
  onChange: (newValue: number) => void
  min?: number
  max?: number
  disabled?: boolean
  size?: "xs" | "sm" | "md"
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  disabled = false,
  size = "sm",
}: QuantityStepperProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - 1)
    if (newValue !== value) {
      onChange(newValue)
    }
  }

  const handleIncrement = () => {
    const newValue = Math.min(max, value + 1)
    if (newValue !== value) {
      onChange(newValue)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQty = parseInt(e.target.value, 10)
    if (!Number.isNaN(newQty) && newQty >= min && newQty <= max) {
      onChange(newQty)
    } else if (e.target.value === "") {
      // Allow empty state during typing
      return
    }
  }

  const sizeConfig = {
    xs: {
      iconSize: "h-3 w-3",
      inputClass: "w-12 h-6 text-xs px-1",
      gap: "gap-1",
    },
    sm: {
      iconSize: "h-4 w-4",
      inputClass: "w-18 h-8 text-sm px-2 py-1",
      gap: "gap-2",
    },
    md: {
      iconSize: "h-4 w-4",
      inputClass: "w-20 h-10 text-base px-3",
      gap: "gap-2",
    },
  }

  const config = sizeConfig[size]

  return (
    <div className={cn("flex items-center", config.gap)}>
      <Button
        type="button"
        variant="outline"
        size={size === "xs" ? "icon-xs" : "icon-sm"}
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <IconMinus className={config.iconSize} />
      </Button>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        className={cn("text-center font-medium border border-input rounded-xs", config.inputClass)}
      />
      <Button
        type="button"
        variant="outline"
        size={size === "xs" ? "icon-xs" : "icon-sm"}
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <IconPlus className={config.iconSize} />
      </Button>
    </div>
  )
}
