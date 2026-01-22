"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface AdminPaginationProps {
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | string[] | undefined>
}

export function AdminPagination({ currentPage, totalPages, searchParams }: AdminPaginationProps) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(searchParams || {})) {
      if (key === "page") continue
      if (!value) continue

      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v)
      } else {
        params.set(key, value)
      }
    }

    params.set("page", page.toString())
    const queryString = params.toString()
    return `/admin/products${queryString ? `?${queryString}` : ""}`
  }

  const pages = getPaginationRange(currentPage, totalPages)

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        className="disabled:opacity-50"
        nativeButton={currentPage === 1}
        render={
          currentPage === 1 ? (
            <button type="button" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <Link href={buildUrl(currentPage - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )
        }
      />

      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${page}-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: unique-ish placeholder for duplicate ... keys
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
              nativeButton={false}
              render={<Link href={buildUrl(page as number)}>{page}</Link>}
            />
          )
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        className="disabled:opacity-50"
        nativeButton={currentPage === totalPages}
        render={
          currentPage === totalPages ? (
            <button type="button" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <Link href={buildUrl(currentPage + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )
        }
      />
    </div>
  )
}

function getPaginationRange(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages: (number | string)[] = [1]

  if (currentPage > 3) pages.push("...")

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) pages.push(i)
  }

  if (currentPage < totalPages - 2) pages.push("...")
  if (!pages.includes(totalPages)) pages.push(totalPages)

  return pages
}
