"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus-visible:ring-ring/50 focus-visible:border-ring disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "",
      },
      size: {
        default: "min-h-[80px]",
        sm: "min-h-[56px] text-sm",
        lg: "min-h-[120px] text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & VariantProps<typeof textareaVariants>
>(({ className, variant, size, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(textareaVariants({ variant, size, className }))}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
