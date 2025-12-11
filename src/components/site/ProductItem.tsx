"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconTrash } from "@/components/ui/icons"
import { QuantityStepper } from "@/components/ui/QuantityStepper"
import { formatPrice, formatVariantSpecs } from "@/lib/utils"

interface Product {
  id: string
  name: string
  slug: string
  image: string | null
}

interface ProductVariant {
  id: string | null
  price: number
  stemLength: number | null
  quantityPerBunch: number | null
}

interface ProductItemProps {
  product: Product
  productVariant: ProductVariant | null
  quantity: number
  imageSize?: "sm" | "md"
  showQuantityControl?: boolean
  showSimilarLink?: boolean
  onQuantityChange?: (newQuantity: number) => void
  onRemove?: () => void
  isUpdating?: boolean
}

const imageSizes = {
  sm: { container: "h-20 w-20", size: "80px" },
  md: { container: "h-24 w-24", size: "96px" },
}

export function ProductItem({
  product,
  productVariant,
  quantity,
  imageSize = "md",
  showQuantityControl = false,
  showSimilarLink = false,
  onQuantityChange,
  onRemove,
  isUpdating = false,
}: ProductItemProps) {
  const price = productVariant?.price ?? 0
  const lineTotal = price * quantity
  const variantSpecs = productVariant
    ? formatVariantSpecs(productVariant.stemLength, productVariant.quantityPerBunch)
    : null

  const sizeConfig = imageSizes[imageSize]

  return (
    <div
      className={`flex gap-4 p-4 bg-white rounded-xs shadow-sm border transition-opacity ${
        isUpdating ? "opacity-60" : ""
      }`}
    >
      {/* Product Image */}
      <Link
        prefetch={false}
        href={`/shop/${product.slug}`}
        className={`relative ${sizeConfig.container} shrink-0 overflow-hidden rounded-xs bg-neutral-100`}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes={sizeConfig.size}
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between items-start">
          <div>
            <Link
              prefetch={false}
              href={`/shop/${product.slug}`}
              className="font-semibold hover:text-primary transition-colors"
            >
              {product.name}
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(price)} each
              {variantSpecs && ` • ${variantSpecs} per set`}
            </p>
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
