import Image from "next/image"
import Link from "next/link"
import { ColorsMiniDisplay } from "@/components/ui/ColorsMiniDisplay"
import { TableCell, TableRow } from "@/components/ui/table"
import type { ProductModel } from "@/generated/models"
import { formatPrice } from "@/lib/utils"

interface ShopProductTableRowProps {
  product: ProductModel
}

export function ShopProductTableRow({ product }: ShopProductTableRowProps) {
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
        <Link
          prefetch={false}
          href={`/shop/${product.slug}`}
          className="text-primary font-medium hover:underline"
        >
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
      <TableCell>{formatPrice(product.price)}</TableCell>
    </TableRow>
  )
}
