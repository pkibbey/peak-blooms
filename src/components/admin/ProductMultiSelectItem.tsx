import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { QuantityStepper } from "@/components/ui/QuantityStepper"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatPrice } from "@/lib/utils"

interface ProductVariant {
  id: string
  price: number
  stemLength: number | null
  quantityPerBunch: number | null
}

interface Product {
  id: string
  name: string
  productCollections?: Array<{
    collection: {
      name: string
    }
  }>
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
  parts.push(formatPrice(variant.price))
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
          {product.productCollections && product.productCollections.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">
              {product.productCollections[0].collection.name}
            </p>
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
              <QuantityStepper
                size="xs"
                value={selectedQuantity}
                onChange={(newQuantity) => onQuantityChange(product.id, newQuantity)}
                disabled={disabled}
                min={1}
              />
            </div>
          )}
        </div>
      )}
    </li>
  )
}
