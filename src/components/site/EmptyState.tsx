import Link from "next/link"
import type * as React from "react"

import { Button } from "../ui/button"
import { IconShoppingBag } from "../ui/icons"

interface EmptyStateProps {
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  primaryAction?: React.ReactNode
  className?: string
}

/**
 * Small, reusable empty state UI used across the site.
 * Keep this minimal so it can be used in server or client components.
 */
export default function EmptyState({
  title = "Nothing here yet",
  description,
  icon,
  primaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {icon ?? <IconShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />}

      {typeof title === "string" ? <h2 className="heading-2 mb-2">{title}</h2> : title}

      {description ? <p className="text-muted-foreground mb-6">{description}</p> : null}

      {primaryAction ?? (
        <Button
          nativeButton={false}
          render={
            <Link prefetch={false} href="/shop">
              Browse Products
            </Link>
          }
        />
      )}
    </div>
  )
}
