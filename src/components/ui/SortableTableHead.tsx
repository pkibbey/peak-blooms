"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { TableHead } from "@/components/ui/table"

interface SortableTableHeadProps {
  label: string
  sortKey: string
  currentSort?: string | null
  currentOrder?: "asc" | "desc" | null
  href: string
  className?: string
}

export function SortableTableHead({
  label,
  sortKey,
  currentSort,
  currentOrder,
  href,
  className = "",
}: SortableTableHeadProps) {
  const isActive = currentSort === sortKey
  const nextOrder = !isActive ? "asc" : currentOrder === "asc" ? "desc" : "asc"

  // Build the sort URL
  const baseUrl = href.split("?")[0]
  const params = new URLSearchParams(href.split("?")[1] || "")
  params.set("sort", sortKey)
  params.set("order", nextOrder)
  params.delete("page") // Reset to page 1 on sort change
  const sortUrl = `${baseUrl}?${params.toString()}`

  return (
    <TableHead className={`cursor-pointer select-none hover:bg-muted/50 ${className}`}>
      <Link href={sortUrl} className="inline-flex items-center gap-2 font-semibold">
        <span>{label}</span>
        <div className="inline-flex h-4 w-4 items-center justify-center">
          {isActive && currentOrder === "asc" && <ChevronUp className="h-4 w-4" />}
          {isActive && currentOrder === "desc" && <ChevronDown className="h-4 w-4" />}
          {!isActive && <ChevronDown className="h-4 w-4 opacity-30" />}
        </div>
      </Link>
    </TableHead>
  )
}
