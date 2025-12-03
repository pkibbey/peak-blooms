import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { IconMinus, IconPlus } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProductVariant {
  id: string
  price: number
  stemLength: number | null
  quantityPerBunch: number | null
}

interface Product {
  id: string
  name: string
  collection?: {
    name: string
  }
  variants?: ProductVariant[]
}

interface ProductMultiSelectItemProps {
  product: Product
  isSelected: boolean
  selectedVariantId: string | null
  selectedQuantity: number
  disabled: boolean
  onToggle: (productId: string) => void
  onVariantChange?: (productId: string, variantId: string) => void
  onQuantityChange?: (productId: string, quantity: number) => void
}

function formatVariantLabel(variant: ProductVariant): string {
  const parts = []
  if (variant.stemLength) parts.push(`${variant.stemLength}cm`)
  if (variant.quantityPerBunch) parts.push(`${variant.quantityPerBunch}`)
  parts.push(`$${variant.price.toFixed(2)}`)
  return parts.join(" • ")
}

export function ProductMultiSelectItem({
  product,
  isSelected,
  selectedVariantId,
  selectedQuantity,
  disabled,
  onToggle,
  onVariantChange,
  onQuantityChange,
}: ProductMultiSelectItemProps) {
  const hasVariants = product.variants && product.variants.length > 0

  return (
    <li className="p-3">
      <Label
        className={`flex cursor-pointer items-center gap-3 ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
      >
        <Checkbox
          checked={isSelected}
          onChange={() => onToggle(product.id)}
          disabled={disabled}
          className="h-4 w-4 rounded"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{product.name}</p>
          {product.collection && (
            <p className="truncate text-xs text-muted-foreground">{product.collection.name}</p>
          )}
        </div>
      </Label>

      {/* Variant Selector and Quantity - shown when product is selected and has variants */}
      {isSelected && hasVariants && (onVariantChange || onQuantityChange) && (
        <div className="mt-2 ml-7 flex flex-wrap items-center gap-3">
          {onVariantChange && (
            <Select
              value={selectedVariantId ?? undefined}
              onValueChange={(value) => onVariantChange(product.id, value)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs w-auto min-w-[180px]">
                <SelectValue placeholder="Select variant" />
              </SelectTrigger>
              <SelectContent>
                {product.variants?.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {formatVariantLabel(variant)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {onQuantityChange && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-1">Qty:</span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onQuantityChange(product.id, selectedQuantity - 1)}
                disabled={disabled || selectedQuantity <= 1}
                aria-label="Decrease quantity"
              >
                <IconMinus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                min="1"
                value={selectedQuantity}
                onChange={(e) => {
                  const newQty = parseInt(e.target.value, 10)
                  if (!Number.isNaN(newQty) && newQty >= 1) {
                    onQuantityChange(product.id, newQty)
                  }
                }}
                disabled={disabled}
                className="w-14 h-8 text-center text-xs px-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onQuantityChange(product.id, selectedQuantity + 1)}
                disabled={disabled}
                aria-label="Increase quantity"
              >
                <IconPlus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}
