"use client"

import Image from "next/image"
import Link from "next/link"
import { ProductControls } from "@/components/site/ProductControls"
import { Button } from "@/components/ui/button"
import { ColorsMiniDisplay } from "@/components/ui/ColorsMiniDisplay"
import { IconTrash } from "@/components/ui/icons"
import { QuantityStepper } from "@/components/ui/QuantityStepper"
import type { ProductModel } from "@/generated/models"
import { formatPrice } from "@/lib/utils"

interface ProductItemProps {
  product: ProductModel
  quantity?: number
  layout?: "grid" | "stacked"
  imageSize?: "sm" | "md"
  showQuantityControl?: boolean
  showSimilarLink?: boolean
  user?: {
    approved: boolean
  } | null
  onQuantityChange?: (newQuantity: number) => void
  onRemove?: () => void
  isUpdating?: boolean
}

const imageSizes = {
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
  // Grid Layout - renders as a product card
  if (layout === "grid") {
    return (
      <div className="group flex flex-col overflow-hidden rounded-xs shadow-md transition-shadow hover:shadow-lg border border-border">
        {/* Image Container */}
        <Link prefetch={false} href={`/shop/${product.slug}`}>
          <div className="relative aspect-square overflow-hidden bg-zinc-200">
            {product.image && (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            {/* Colors Display - Bottom Left */}
            {product.colors && product.colors.length > 0 && (
              <div className="absolute bottom-2 left-2 bg-background/90 rounded-md px-2 py-1">
                <ColorsMiniDisplay colorIds={product.colors} />
              </div>
            )}
          </div>
        </Link>

        {/* Card Content */}
        <div className="flex flex-col justify-between bg-background p-4 gap-2 grow">
          <div>
            <Link prefetch={false} href={`/shop/${product.slug}`}>
              <h3 className="font-bold font-serif">{product.name}</h3>
            </Link>
          </div>

          <ProductControls product={product} user={user} mode="card" />
        </div>
      </div>
    )
  }

  // Stacked Layout - renders as a list item (cart/order context)
  const price = product.price
  const lineTotal = price * quantity

  const sizeConfig = imageSizes[imageSize]

  return (
    <div
      className={`flex md:flex-row flex-col bg-background rounded-xs shadow-sm border transition-opacity ${
        isUpdating ? "opacity-60" : ""
      }`}
    >
      {/* Product Image */}
      <Link
        prefetch={false}
        href={`/shop/${product.slug}`}
        className={`relative ${sizeConfig.container} shrink-0 overflow-hidden`}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover md:rounded-l-sm rounded-t-sm md:rounded-t-none"
            sizes={sizeConfig.size}
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex justify-between items-start">
          <div>
            <Link
              prefetch={false}
              href={`/shop/${product.slug}`}
              className="font-semibold hover:text-primary transition-colors"
            >
              {product.name}
            </Link>
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
              <div className="flex flex-col items-end gap-2">
                <QuantityStepper
                  size="sm"
                  value={quantity}
                  onChange={(newQuantity) => onQuantityChange?.(newQuantity)}
                  disabled={isUpdating}
                  min={1}
                />
                {onRemove && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRemove}
                    disabled={isUpdating}
                    aria-label={`Remove ${product.name} from cart`}
                    className="border-destructive text-gray-600 hover:bg-destructive hover:text-destructive"
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
