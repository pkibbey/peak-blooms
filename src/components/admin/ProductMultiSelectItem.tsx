import { Checkbox } from "@/components/ui/checkbox"
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
  countPerBunch: number | null
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
  disabled: boolean
  onToggle: (productId: string) => void
  onVariantChange?: (productId: string, variantId: string | null) => void
}

function formatVariantLabel(variant: ProductVariant): string {
  const parts = []
  if (variant.stemLength) parts.push(`${variant.stemLength}cm`)
  if (variant.countPerBunch) parts.push(`${variant.countPerBunch} stems`)
  parts.push(`$${variant.price.toFixed(2)}`)
  return parts.join(" • ")
}

export function ProductMultiSelectItem({
  product,
  isSelected,
  selectedVariantId,
  disabled,
  onToggle,
  onVariantChange,
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

      {/* Variant Selector - shown when product is selected and has variants */}
      {isSelected && hasVariants && onVariantChange && (
        <div className="mt-2 ml-7">
          <Select
            value={selectedVariantId ?? "none"}
            onValueChange={(value) => onVariantChange(product.id, value === "none" ? null : value)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific variant</SelectItem>
              {product.variants?.map((variant) => (
                <SelectItem key={variant.id} value={variant.id}>
                  {formatVariantLabel(variant)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </li>
  )
}
