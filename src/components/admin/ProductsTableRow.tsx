import Image from "next/image"
import Link from "next/link"
import { TableCell, TableRow } from "@/components/ui/table"
import type { ProductModel } from "@/generated/models"
import { cn, formatPrice } from "@/lib/utils"
import { ColorsMiniDisplay } from "../ui/ColorsMiniDisplay"

interface ProductRowProps {
  product: ProductModel
}

export default function ProductsTableRow({ product }: ProductRowProps) {
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
      <TableCell className="hidden lg:table-cell">
        <ColorsMiniDisplay colorIds={product.colors} size="md" />
      </TableCell>
    </TableRow>
  )
}
