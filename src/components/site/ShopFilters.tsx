"use client"

import { ProductFilters } from "@/components/filters/ProductFilters"
import { Label } from "@/components/ui/label"
import { ViewToggle } from "./ViewToggle"

interface ShopFiltersProps {
  availableColorIds?: string[]
  availableCollections?: Array<{ id: string; name: string }>
}

export function ShopFilters({
  availableColorIds = [],
  availableCollections = [],
}: ShopFiltersProps) {
  return (
    <ProductFilters
      basePath="/shop"
      showSearch
      showPrice
      showProductType
      showCollections
      showColors
      availableColorIds={availableColorIds}
      availableCollections={availableCollections}
    >
      <div className="gap-4 items-center">
        <Label htmlFor="collection-all" className="text-xs font-medium text-gray-700 mb-2">
          Layout
        </Label>
        <ViewToggle />
      </div>
    </ProductFilters>
  )
}
