"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import OrderHistoryItem from "@/components/site/OrderHistoryItem"
import { Button } from "@/components/ui/button"
import { IconPackage } from "@/components/ui/icons"
import type { OrderWithItems } from "@/lib/types/orders"

/**
 * OrderHistoryCardProps - Uses generated types with items and products
 * Omits FK and fields not needed in UI
 */
interface OrderHistoryCardProps {
  orders: OrderWithItems[]
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | string[] | undefined>
}

export default function OrderHistoryCard({
  orders,
  currentPage,
  totalPages,
  searchParams,
}: OrderHistoryCardProps) {
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
    return `/account${queryString ? `?${queryString}` : ""}`
  }

  const pages = getPaginationRange(currentPage, totalPages)

  return (
    <div className="rounded-lg border border-border p-6">
      <div className="mb-6">
        <h2 className="heading-3">Order History</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {orders.length > 0
            ? `You have ${orders.length} total order${orders.length === 1 ? "" : "s"}`
            : "View and manage your orders"}
        </p>
      </div>

      {orders.length > 0 ? (
        <>
          <div className="space-y-1 mb-6">
            {orders.map((order) => (
              <OrderHistoryItem key={order.id} order={order} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 justify-center pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                className="disabled:opacity-50"
                nativeButton={false}
                render={
                  currentPage === 1 ? (
                    <button type="button" disabled>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  ) : (
                    <Link prefetch={false} href={buildUrl(currentPage - 1)}>
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
                        // biome-ignore lint/suspicious/noArrayIndexKey: ellipsis dots have the same id
                        key={`ellipsis-${page}-${index}`}
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
                      render={
                        <Link prefetch={false} href={buildUrl(page as number)}>
                          {page}
                        </Link>
                      }
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
                    <Link prefetch={false} href={buildUrl(currentPage + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )
                }
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <IconPackage className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No orders yet</p>
          <Button
            nativeButton={false}
            render={
              <Link prefetch={false} href="/shop">
                Browse Products
              </Link>
            }
          />
        </div>
      )}
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
