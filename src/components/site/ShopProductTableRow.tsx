import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ColorsMiniDisplay } from "@/components/ui/ColorsMiniDisplay"
import { IconPackage } from "@/components/ui/icons"
import { TableCell, TableRow } from "@/components/ui/table"
import type { ProductModel, ProductVariantModel } from "@/generated/models"
import { formatPrice } from "@/lib/utils"

interface ShopProductTableRowProps {
  product: ProductModel & {
    variants?: ProductVariantModel[]
  }
}

export function ShopProductTableRow({ product }: ShopProductTableRowProps) {
  const hasBoxlotVariant = product.variants?.some((v) => v.isBoxlot) ?? false

  // Calculate price range
  const getPriceRange = (variants?: ProductVariantModel[]) => {
    if (!variants || variants.length === 0) return { minPrice: 0, maxPrice: 0 }
    const prices = variants.map((v) => v.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    return { minPrice, maxPrice }
  }

  const { minPrice, maxPrice } = getPriceRange(product.variants)
  const priceDisplay =
    minPrice === maxPrice
      ? `${formatPrice(minPrice)}`
      : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`

  return (
    <TableRow>
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
        <Link href={`/shop/${product.slug}`} className="text-primary font-medium hover:underline">
          {product.name}
        </Link>
      </TableCell>

      {/* Description */}
      <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">
        {product.description || "—"}
      </TableCell>

      {/* Colors */}
      <TableCell className="hidden md:table-cell">
        <ColorsMiniDisplay colorIds={product.colors} />
      </TableCell>

      {/* Price */}
      <TableCell>{product.variants && product.variants.length > 0 ? priceDisplay : "—"}</TableCell>

      {/* Status Badge */}
      <TableCell>
        {hasBoxlotVariant && (
          <Badge
            variant="secondary"
            className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100"
          >
            <IconPackage className="h-3 w-3" />
            Boxlot
          </Badge>
        )}
      </TableCell>
    </TableRow>
  )
}
