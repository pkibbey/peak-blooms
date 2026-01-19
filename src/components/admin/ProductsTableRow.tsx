"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { toggleProductFeaturedAction } from "@/app/actions/products"
import { Checkbox } from "@/components/ui/checkbox"
import { TableCell, TableRow } from "@/components/ui/table"
import type { ProductModel } from "@/generated/models"
import { PRODUCT_TYPE_LABELS } from "@/lib/product-types"
import { cn, formatPrice } from "@/lib/utils"
import { ColorsMiniDisplay } from "../ui/ColorsMiniDisplay"

interface ProductRowProps {
  product: ProductModel
}

export default function ProductsTableRow({ product }: ProductRowProps) {
  const priceDisplay = formatPrice(product.price)
  const router = useRouter()
  const [featured, setFeatured] = useState<boolean>(!!product.featured)
  const [isPending, startTransition] = useTransition()

  return (
    <TableRow key={product.id} className={cn(product.featured && "bg-blue-300/10")}>
      {/* Image */}
      <TableCell>
        <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-muted">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
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

      {/* Product Type */}
      <TableCell className="hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {PRODUCT_TYPE_LABELS[product.productType]}
        </span>
      </TableCell>

      {/* Featured */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={!!featured}
            onCheckedChange={(value) => {
              const previous = featured
              setFeatured(value)

              startTransition(async () => {
                try {
                  const result = await toggleProductFeaturedAction({
                    id: product.id,
                    featured: value,
                  })
                  if (!result.success) {
                    setFeatured(previous)
                    toast.error(result.error)
                    return
                  }
                  toast.success(
                    `${value ? "Marked featured" : "Removed featured"} - ${product.name}`
                  )
                  router.refresh()
                } catch (_err) {
                  setFeatured(previous)
                  toast.error("Failed to update product")
                }
              })
            }}
            disabled={isPending}
            aria-label={`Toggle featured for ${product.name}`}
          />
        </div>
      </TableCell>

      {/* Colors */}
      <TableCell className="hidden lg:table-cell">
        <ColorsMiniDisplay colorIds={product.colors} size="md" />
      </TableCell>
    </TableRow>
  )
}
