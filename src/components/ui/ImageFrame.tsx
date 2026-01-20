import clsx from "clsx"
import type React from "react"

interface ImageFrameProps {
  className?: string
  children?: React.ReactNode
}

export function ImageFrame({ className, children }: ImageFrameProps) {
  return (
    <div
      className={clsx(
        "shadow-2xs group-hover:shadow-2xl transition-shadow relative overflow-hidden bg-zinc-200",
        className
      )}
    >
      {children}
    </div>
  )
}
