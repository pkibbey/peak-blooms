"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn, formatPrice } from "@/lib/utils"

interface ProductRowProps {
  product: {
    id: string
    name: string
    slug: string
    featured: boolean
    image: string | null
    collection: {
      id: string
      name: string
    }
    variants: {
      id: string
      price: number
    }[]
    description?: string | null
    colors?: string[] | null
  }
}

export default function ProductsTableRow({ product }: ProductRowProps) {
  const router = useRouter()
  const [featured, setFeatured] = useState<boolean>(!!product.featured)

  const getPriceRange = (variants: { price: number }[]) => {
    const prices = variants.map((v) => v.price)
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
    return { minPrice, maxPrice }
  }

  const { minPrice, maxPrice } = getPriceRange(product.variants)
  const priceDisplay =
    minPrice === maxPrice
      ? `${formatPrice(minPrice)}`
      : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`

  return (
    <TableRow key={product.id} className={cn(product.featured && "bg-blue-300/10")}>
      {/* Image */}
      <TableCell>
        <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-muted">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              —
            </div>
          )}
        </div>
      </TableCell>

      {/* Name */}
      <TableCell>
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="text-primary font-medium hover:underline"
        >
          {product.name}
        </Link>
      </TableCell>

      {/* Price */}
      <TableCell className="hidden lg:table-cell">
        {product.variants.length > 0 ? priceDisplay : "—"}
      </TableCell>

      {/* Colors */}
      <TableCell className="hidden md:table-cell">
        {product.colors && product.colors.length > 0 ? (
          <div className="flex gap-2 items-center">
            <div className="flex -space-x-1">
              {product.colors.slice(0, 5).map((c) => (
                <div
                  key={c}
                  role="img"
                  aria-hidden={true}
                  title={c}
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            {product.colors.length > 5 ? (
              <span className="text-xs text-muted-foreground">+{product.colors.length - 5}</span>
            ) : null}
            <span className="sr-only">Colors: {product.colors.join(", ")}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Description (truncated) */}
      <TableCell
        className="hidden lg:table-cell text-muted-foreground"
        title={product.description ?? ""}
      >
        {product.description && product.description.length > 120
          ? `${product.description.slice(0, 120).trim()}…`
          : product.description || "—"}
      </TableCell>

      {/* Featured */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={!!featured}
            onChange={async (e) => {
              const newVal = (e.target as HTMLInputElement).checked
              const previous = featured
              setFeatured(newVal)

              try {
                const res = await fetch(`/api/products/${product.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ featured: newVal }),
                })

                if (!res.ok) {
                  const body = await res.json().catch(() => ({}))
                  throw new Error(body?.error || "Failed to update product")
                }

                toast.success(
                  `${newVal ? "Marked featured" : "Removed featured"} — ${product.name}`
                )
                router.refresh()
              } catch (err) {
                setFeatured(previous)
                toast.error(err instanceof Error ? err.message : "Failed to update product")
              }
            }}
            aria-label={`Toggle featured for ${product.name}`}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}
