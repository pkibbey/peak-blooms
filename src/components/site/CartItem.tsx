"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconMinus, IconPlus, IconTrash } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPrice, formatVariantSpecs } from "@/lib/utils"

interface CartProduct {
  id: string
  name: string
  slug: string
  image: string | null
}

interface CartVariant {
  id: string
  price: number
  stemLength: number | null
  quantityPerBunch: number | null
}

export interface CartItemData {
  id: string
  productId: string
  productVariantId: string | null
  quantity: number
  product: CartProduct
  productVariant: CartVariant | null
}

interface CartItemProps {
  item: CartItemData
  isUpdating: boolean
  onUpdateQuantity: (itemId: string, newQuantity: number) => void
  onRemove: (itemId: string, productName: string) => void
}

export function CartItem({ item, isUpdating, onUpdateQuantity, onRemove }: CartItemProps) {
  const price = item.productVariant?.price ?? 0
  const lineTotal = price * item.quantity
  const variantSpecs = item.productVariant
    ? formatVariantSpecs(item.productVariant.stemLength, item.productVariant.quantityPerBunch)
    : null

  return (
    <div
      className={`flex gap-4 p-4 bg-white rounded-xs shadow-sm border transition-opacity ${
        isUpdating ? "opacity-60" : ""
      }`}
    >
      {/* Product Image */}
      <Link
        href={`/shop/${item.product.slug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xs bg-neutral-100"
      >
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <Link
              href={`/shop/${item.product.slug}`}
              className="font-medium hover:text-primary transition-colors"
            >
              {item.product.name}
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(price)} each
              {variantSpecs && ` • ${variantSpecs}`}
            </p>
          </div>
          <p className="font-medium">{formatPrice(lineTotal)}</p>
        </div>

        {/* View Options Link */}
        <div className="mt-2">
          <Link
            href={`/shop/${item.product.slug}`}
            className="text-xs text-primary hover:underline"
          >
            View similar options →
          </Link>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-end justify-between gap-4 mt-auto pt-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-semibold text-muted-foreground">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                aria-label="Decrease quantity"
              >
                <IconMinus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => {
                  const newQty = parseInt(e.target.value, 10)
                  if (!Number.isNaN(newQty) && newQty >= 1) {
                    onUpdateQuantity(item.id, newQty)
                  }
                }}
                disabled={isUpdating}
                className="w-18 text-center font-medium border border-input rounded-xs px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={isUpdating}
                aria-label="Increase quantity"
              >
                <IconPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(item.id, item.product.name)}
            disabled={isUpdating}
            aria-label={`Remove ${item.product.name} from cart`}
            className="border-destructive text-destructive hover:bg-destructive hover:text-white"
          >
            <IconTrash className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}
