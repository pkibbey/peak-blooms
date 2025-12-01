"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & { className?: string }

export const H1 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, children, ...props }, ref) => (
    <h1 ref={ref} className={cn("heading-1", className)} {...props}>
      {children}
    </h1>
  )
)
H1.displayName = "H1"

export const H2 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, children, ...props }, ref) => (
    <h2 ref={ref} className={cn("heading-2", className)} {...props}>
      {children}
    </h2>
  )
)
H2.displayName = "H2"

export const H3 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={cn("heading-3", className)} {...props}>
      {children}
    </h3>
  )
)
H3.displayName = "H3"

export const H4 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, children, ...props }, ref) => (
    <h4 ref={ref} className={cn("heading-4", className)} {...props}>
      {children}
    </h4>
  )
)
H4.displayName = "H4"

export const H5 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, children, ...props }, ref) => (
    <h5 ref={ref} className={cn("heading-5", className)} {...props}>
      {children}
    </h5>
  )
)
H5.displayName = "H5"

export const H6 = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, children, ...props }, ref) => (
    <h6 ref={ref} className={cn("heading-6", className)} {...props}>
      {children}
    </h6>
  )
)
H6.displayName = "H6"

export default { H1, H2, H3, H4, H5, H6 }
