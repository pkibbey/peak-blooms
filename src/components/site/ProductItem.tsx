"use client"

import { Pencil } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ProductControls } from "@/components/site/ProductControls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorsMiniDisplay } from "@/components/ui/ColorsMiniDisplay"
import { IconTrash } from "@/components/ui/icons"
import { QuantityStepper } from "@/components/ui/QuantityStepper"
import type { ProductModel } from "@/generated/models"
import { PRODUCT_TYPE_LABELS } from "@/lib/product-types"
import type { SessionUser } from "@/lib/query-types"
import { formatPrice } from "@/lib/utils"

interface ProductItemProps {
  product: ProductModel
  quantity?: number
  layout?: "grid" | "stacked"
  imageSize?: "xs" | "sm" | "md"
  showQuantityControl?: boolean
  showSimilarLink?: boolean
  user?: SessionUser | null
  onQuantityChange?: (newQuantity: number) => void
  onRemove?: () => void
  isUpdating?: boolean
}

const imageSizes = {
  xs: { container: "h-16 w-16", size: "64px" },
  sm: { container: "h-24 w-24", size: "96px" },
  md: { container: "h-36 w-full md:w-36", size: "144px" },
}

export function ProductItem({
  product,
  quantity = 1,
  layout = "stacked",
  imageSize = "md",
  showQuantityControl = false,
  showSimilarLink = false,
  user,
  onQuantityChange,
  onRemove,
  isUpdating = false,
}: ProductItemProps) {
  const router = useRouter()
  const isAdmin = user?.role === "ADMIN"

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/admin/products/${product.id}/edit`)
  }

  // Grid Layout - renders as a product card
  if (layout === "grid") {
    return (
      <div className="group flex flex-col overflow-hidden rounded-xs transition-shadow border border-border">
        {/* Image Container */}
        <Link prefetch={false} href={`/shop/${product.slug}`}>
          <div className="shadow-2xs hover:shadow-lg transition-shadow relative aspect-square overflow-hidden bg-zinc-200">
            {product.images && product.images.length > 0 && (
              <>
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105 absolute inset-0 z-10"
                />
                {product.images.length > 1 && (
                  <Image
                    src={product.images[1]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100 absolute inset-0 z-20"
                  />
                )}
              </>
            )}
            {/* Colors Display - Bottom Left */}
            {product.colors && product.colors.length > 0 && (
              <div className="z-20 absolute bottom-2 left-2 bg-background/90 rounded-md px-2 py-1">
                <ColorsMiniDisplay colorIds={product.colors} />
              </div>
            )}
            {/* Edit Button - Top Right (Admin Only) */}
            {isAdmin && (
              <Button
                onClick={handleEditClick}
                variant="outline"
                size="icon-xs"
                className="absolute top-2 right-2 z-30 bg-background/80 hover:bg-background"
                aria-label="Edit product"
              >
                <Pencil className="p-0.5" />
              </Button>
            )}
          </div>
        </Link>

        {/* Card Content */}
        <div className="flex flex-col justify-between bg-background p-4 gap-2 grow">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link prefetch={false} href={`/shop/${product.slug}`} className="min-w-0">
                <h3 className="text-lg font-semibold text-secondary-foreground truncate">
                  {product.name}
                </h3>
              </Link>
              <Badge variant="secondary" className="text-xs">
                {PRODUCT_TYPE_LABELS[product.productType]}
              </Badge>
            </div>
          </div>

          <ProductControls product={product} user={user} mode="card" />
        </div>
      </div>
    )
  }

  // Stacked Layout - renders as a list item (cart/order context)
  const price = product.price
  const lineTotal = price !== 0 ? price * quantity : 0

  const sizeConfig = imageSizes[imageSize]

  return (
    <div
      className={`group flex md:flex-row flex-col bg-background rounded-xs shadow-sm border transition-opacity ${
        isUpdating ? "opacity-60" : ""
      }`}
    >
      {/* Product Image */}
      <Link
        prefetch={false}
        href={`/shop/${product.slug}`}
        className={`relative ${sizeConfig.container} shrink-0 overflow-hidden`}
      >
        {product.images && product.images.length > 0 ? (
          <>
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes={sizeConfig.size}
              className="object-cover md:rounded-l-sm rounded-t-sm md:rounded-t-none absolute inset-0 z-10"
            />
            {product.images.length > 1 && (
              <Image
                src={product.images[1]}
                alt={product.name}
                fill
                sizes={sizeConfig.size}
                className="object-cover md:rounded-l-sm rounded-t-sm md:rounded-t-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col px-4 py-3">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                prefetch={false}
                href={`/shop/${product.slug}`}
                className="font-semibold hover:text-primary transition-colors truncate"
              >
                {product.name}
              </Link>
              <Badge variant="secondary" className="text-xs">
                {PRODUCT_TYPE_LABELS[product.productType]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{formatPrice(price)} each</p>
            {/* View Options Link */}
            {showSimilarLink && (
              <div className="mt-2">
                <Link
                  prefetch={false}
                  href={`/shop/${product.slug}`}
                  className="text-sm text-primary underline"
                >
                  View similar options →
                </Link>
              </div>
            )}
          </div>
          {/* Right Side: Price & Controls */}
          <div className="flex flex-col items-end justify-end gap-2">
            <p className="text-xl font-medium text-foreground">{formatPrice(lineTotal)}</p>
            {showQuantityControl ? (
              <div className="flex flex-col items-end gap-4">
                <QuantityStepper
                  size="sm"
                  value={quantity}
                  onChange={(newQuantity) => onQuantityChange?.(newQuantity)}
                  disabled={isUpdating}
                  min={1}
                />
                {onRemove && (
                  <Button
                    variant="outline-destructive"
                    size="sm"
                    onClick={onRemove}
                    disabled={isUpdating}
                    aria-label={`Remove ${product.name} from cart`}
                  >
                    <IconTrash className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
