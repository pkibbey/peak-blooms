import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Product {
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
  colors?: string[] | null
}

interface ProductsTableProps {
  products: Product[]
}

export default function ProductsTable({ products }: ProductsTableProps) {
  // Calculate price range helper
  const getPriceRange = (variants: { price: number }[]) => {
    const prices = variants.map((v) => v.price)
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
    return { minPrice, maxPrice }
  }

  if (products.length === 0) {
    return (
      <p className="text-muted-foreground">
        No products found. Add your first product to get started.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Collection</TableHead>
            <TableHead className="hidden lg:table-cell">Price</TableHead>
            <TableHead className="hidden md:table-cell">Colors</TableHead>
            <TableHead className="hidden lg:table-cell">Variants</TableHead>
            <TableHead>Featured</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const { minPrice, maxPrice } = getPriceRange(product.variants)
            const priceDisplay =
              minPrice === maxPrice
                ? `$${minPrice.toFixed(2)}`
                : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`

            return (
              <TableRow key={product.id}>
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

                {/* Collection */}
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {product.collection.name}
                </TableCell>

                {/* Price */}
                <TableCell className="hidden lg:table-cell">
                  {product.variants.length > 0 ? priceDisplay : "—"}
                </TableCell>

                {/* Colors */}
                <TableCell className="hidden md:table-cell">
                  {/* Render small color swatches if available */}
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
                        <span className="text-xs text-muted-foreground">
                          +{product.colors.length - 5}
                        </span>
                      ) : null}
                      {/* Screen reader description of this product's colors */}
                      <span className="sr-only">Colors: {product.colors.join(", ")}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Variants */}
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {product.variants.length}
                </TableCell>

                {/* Featured */}
                <TableCell>
                  {product.featured ? (
                    <Badge variant="secondary">Featured</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {/* (no global sr-only entry — per-row sr-only is provided inside the colors cell) */}
    </div>
  )
}
