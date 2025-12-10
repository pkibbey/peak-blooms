"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ShopPaginationProps {
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | string[] | undefined>
}

export function ShopPagination({ currentPage, totalPages, searchParams }: ShopPaginationProps) {
  // Build query string from existing search params, excluding page
  const buildUrl = (page: number) => {
    const params = new URLSearchParams()

    Object.entries(searchParams).forEach(([key, value]) => {
      if (key === "page") return // Skip page param
      if (!value) return

      if (Array.isArray(value)) {
        value.forEach((v) => {
          params.append(key, v)
        })
      } else {
        params.set(key, value)
      }
    })

    params.set("page", page.toString())
    const queryString = params.toString()
    return `/shop${queryString ? `?${queryString}` : ""}`
  }

  const pages = getPaginationRange(currentPage, totalPages)

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={currentPage === 1}
        className="disabled:opacity-50"
      >
        {currentPage === 1 ? (
          <button type="button" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <Link prefetch={false} href={buildUrl(currentPage - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        )}
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${page}+${
                  // biome-ignore lint/suspicious/noArrayIndexKey: Contains duplicate ... strings
                  index
                }`}
                className="px-2 text-muted-foreground"
              >
                {page}
              </span>
            )
          }

          return (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link prefetch={false} href={buildUrl(page as number)}>
                {page}
              </Link>
            </Button>
          )
        })}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={currentPage === totalPages}
        className="disabled:opacity-50"
      >
        {currentPage === totalPages ? (
          <button type="button" disabled>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <Link prefetch={false} href={buildUrl(currentPage + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </Button>
    </div>
  )
}

/**
 * Get pagination range with ellipsis for large page counts
 * Shows: [1] [2] ... [current-1] [current] [current+1] ... [last]
 */
function getPaginationRange(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    // Show all pages if 7 or fewer
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = [1] // Always show first page

  // Add left ellipsis and pages
  if (currentPage > 3) {
    pages.push("...")
  }

  // Add pages around current
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i)
    }
  }

  // Add right ellipsis and last page
  if (currentPage < totalPages - 2) {
    pages.push("...")
  }

  if (!pages.includes(totalPages)) {
    pages.push(totalPages)
  }

  return pages
}
