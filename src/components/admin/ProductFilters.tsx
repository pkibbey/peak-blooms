"use client"

import { ProductFilters as BaseProductFilters } from "@/components/filters/ProductFilters"
import type { ProductType } from "@/generated/enums"

interface ProductFiltersProps {
  productTypes: ProductType[]
}

export function ProductFilters({ productTypes }: ProductFiltersProps) {
  return (
    <BaseProductFilters
      basePath="/admin/products"
      showSearch
      showDescriptionFilter
      showImageFilter
      showProductType
      productTypeSelectionMode="multiple"
      productTypes={productTypes}
    />
  )
}
