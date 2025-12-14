"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { ColorsMiniDisplay } from "@/components/ui/ColorsMiniDisplay"
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
    price: number
    productCollections: {
      collection: {
        id: string
        name: string
      }
    }[]
    description?: string | null
    colors?: string[] | null
  }
}

export default function ProductsTableRow({ product }: ProductRowProps) {
  const router = useRouter()
  const [featured, setFeatured] = useState<boolean>(!!product.featured)

  const priceDisplay = formatPrice(product.price)

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
          prefetch={false}
          href={`/admin/products/${product.id}/edit`}
          className="text-primary font-medium hover:underline"
        >
          {product.name}
        </Link>
      </TableCell>

      {/* Price */}
      <TableCell className="hidden lg:table-cell">{priceDisplay}</TableCell>

      {/* Colors */}
      <TableCell className="hidden md:table-cell">
        <ColorsMiniDisplay colorIds={product.colors} />
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
            onCheckedChange={async (value) => {
              const previous = featured
              setFeatured(value)

              try {
                const res = await fetch(`/api/products/${product.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ featured: value }),
                })

                if (!res.ok) {
                  const body = await res.json().catch(() => ({}))
                  throw new Error(body?.error || "Failed to update product")
                }

                toast.success(`${value ? "Marked featured" : "Removed featured"} — ${product.name}`)
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
