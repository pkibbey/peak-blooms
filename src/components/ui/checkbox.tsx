"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const base =
  "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border border-border bg-background text-muted-foreground focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-50 disabled:cursor-not-allowed"

const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return <input type="checkbox" ref={ref} className={cn(base, className)} {...props} />
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
