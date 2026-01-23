"use client"

import Image from "next/image"
import type React from "react"
import { cn } from "@/lib/utils"

export interface StackedImagesProps {
  images: Array<{ src?: string | null; alt?: string }>
  maxDisplay?: number
  size?: "sm" | "md"
  className?: string
}

export const StackedImages: React.FC<StackedImagesProps> = ({
  images,
  maxDisplay = 5,
  size = "sm",
  className,
}) => {
  const display = images.slice(0, maxDisplay)
  const remaining = images.length - display.length

  const sizeClass = size === "sm" ? "h-6 w-6" : "h-9 w-9"
  const spaceClass = size === "sm" ? "-space-x-2" : "-space-x-4"

  return (
    <div className={cn("flex items-center", spaceClass, className)}>
      <span className="sr-only">
        {images
          .map((img) => img.alt ?? "")
          .filter(Boolean)
          .join(", ")}
        {remaining > 0 ? `, ${remaining} more` : ""}
      </span>

      {display.map((img, idx) => (
        <div
          key={`${img.src ?? "placeholder"}-${idx}`}
          className={cn(
            "relative shrink-0 overflow-hidden rounded-full border-2 border-background bg-muted shadow-sm transition-transform",
            sizeClass
          )}
        >
          {img.src ? (
            <Image
              src={img.src}
              alt={img.alt ?? ""}
              fill
              className="object-cover"
              sizes={size === "sm" ? "24px" : "36px"}
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>
      ))}

      {remaining > 0 && (
        <div
          aria-hidden
          className={cn(
            "relative shrink-0 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground shadow-sm",
            sizeClass
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
