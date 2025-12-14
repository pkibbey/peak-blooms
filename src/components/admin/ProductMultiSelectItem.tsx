import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { QuantityStepper } from "@/components/ui/QuantityStepper"

interface Product {
  id: string
  name: string
  price: number
  productCollections?: Array<{
    collection: {
      name: string
    }
  }>
}

interface ProductMultiSelectItemProps {
  product: Product
  isSelected: boolean
  selectedQuantity: number
  disabled: boolean
  onToggle: (productId: string) => void
  onQuantityChange?: (productId: string, quantity: number) => void
}

export function ProductMultiSelectItem({
  product,
  isSelected,
  selectedQuantity,
  disabled,
  onToggle,
  onQuantityChange,
}: ProductMultiSelectItemProps) {
  return (
    <li className="p-3">
      <Label
        className={`flex cursor-pointer items-center gap-3 ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(product.id)}
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

      {/* Quantity Control - shown when product is selected */}
      {isSelected && onQuantityChange && (
        <div className="mt-2 ml-7 flex items-center gap-3">
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
        </div>
      )}
    </li>
  )
}
