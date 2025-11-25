"use client"

import { useCallback, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { IconMenu, IconX } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

interface ShopFiltersProps {
  categories: Array<{ id: string; name: string }>
  colors: string[]
  stemLengths: number[]
  user?: {
    role?: "CUSTOMER" | "ADMIN"
    approved?: boolean
    email?: string | null
    name?: string | null
  } | null
}

const PRICE_RANGES = [
  { label: "All Prices", min: undefined, max: undefined },
  { label: "Under $25", min: undefined, max: 25 },
  { label: "$25 - $50", min: 25, max: 50 },
  { label: "$50 - $100", min: 50, max: 100 },
  { label: "$100+", min: 100, max: undefined },
]

export default function ShopFilters({ categories, colors, stemLengths, user }: ShopFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mobileOpen, setMobileOpen] = useState(false)

  const isApproved = user?.approved === true

  const selectedColor = searchParams.get("color") || ""
  const selectedStemLength = searchParams.get("stemLength") || ""
  const selectedPriceMin = searchParams.get("priceMin")
  const selectedPriceMax = searchParams.get("priceMax")
  const selectedCategory = searchParams.get("categoryId") || ""

  // Create query string based on current filters
  const createQueryString = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      return params.toString()
    },
    [searchParams]
  )

  // Handle filter changes with debouncing
  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const queryString = createQueryString(updates)
      const newUrl = queryString ? `?${queryString}` : ""
      router.push(`/shop${newUrl}`)
    },
    [createQueryString, router]
  )

  const handleColorChange = (value: string) => {
    updateFilters({ color: value === "clear" ? undefined : value })
  }

  const handleStemLengthChange = (value: string) => {
    updateFilters({ stemLength: value === "clear" ? undefined : value })
  }

  const handleCategoryChange = (value: string) => {
    updateFilters({ categoryId: value === "clear" ? undefined : value })
  }

  const handlePriceRangeChange = (minPrice: number | undefined, maxPrice: number | undefined) => {
    updateFilters({
      priceMin: minPrice !== undefined ? minPrice.toString() : undefined,
      priceMax: maxPrice !== undefined ? maxPrice.toString() : undefined,
    })
  }

  const handleClearFilters = () => {
    router.push("/shop")
    setMobileOpen(false)
  }

  const hasActiveFilters =
    selectedColor || selectedStemLength || selectedPriceMin || selectedPriceMax || selectedCategory

  // Mobile vertical filter content (collapsible panel)
  const MobileFilterContent = (
    <div className="flex flex-col gap-4">
      {/* Category Filter */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Category</Label>
        <Select value={selectedCategory || "clear"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clear">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Filter */}
      {colors.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Color</Label>
          <Select value={selectedColor || "clear"} onValueChange={handleColorChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Colors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clear">All Colors</SelectItem>
              {colors.map((color) => (
                <SelectItem key={color} value={color}>
                  {color}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Stem Length Filter */}
      {stemLengths.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Stem Length</Label>
          <Select value={selectedStemLength || "clear"} onValueChange={handleStemLengthChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Lengths" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clear">All Lengths</SelectItem>
              {stemLengths.map((length) => (
                <SelectItem key={length} value={length.toString()}>
                  {length} in
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Price Range Filter */}
      {isApproved && (
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Price Range</Label>
          <Select
            value={
              selectedPriceMin && selectedPriceMax
                ? `${selectedPriceMin}-${selectedPriceMax}`
                : selectedPriceMin
                  ? `${selectedPriceMin}-`
                  : selectedPriceMax
                    ? `-${selectedPriceMax}`
                    : "clear"
            }
            onValueChange={(value) => {
              if (value === "clear") {
                handlePriceRangeChange(undefined, undefined)
              } else {
                const newRange = PRICE_RANGES.find(
                  (r) => `${r.min || ""}-${r.max || ""}` === value
                )
                if (newRange) {
                  handlePriceRangeChange(newRange.min, newRange.max)
                }
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Prices" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((range, idx) => {
                const value =
                  range.min === undefined && range.max === undefined
                    ? "clear"
                    : `${range.min ?? ""}-${range.max ?? ""}`;

                return (
                  <SelectItem key={idx} value={value}>
                    {range.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="w-full"
        >
          Clear Filters
        </Button>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Filters - Horizontal Bar */}
      <h3 className="hidden md:block text-lg font-semibold">Product Filters</h3>
      <div className="hidden md:block mb-6 bg-secondary/30 rounded-lg px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <Select value={selectedCategory || "clear"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-auto min-w-[140px] h-9 text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clear">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Color Filter */}
          {colors.length > 0 && (
            <Select value={selectedColor || "clear"} onValueChange={handleColorChange}>
              <SelectTrigger className="w-auto min-w-[120px] h-9 text-sm">
                <SelectValue placeholder="All Colors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">All Colors</SelectItem>
                {colors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Stem Length Filter */}
          {stemLengths.length > 0 && (
            <Select value={selectedStemLength || "clear"} onValueChange={handleStemLengthChange}>
              <SelectTrigger className="w-auto min-w-[120px] h-9 text-sm">
                <SelectValue placeholder="All Lengths" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">All Lengths</SelectItem>
                {stemLengths.map((length) => (
                  <SelectItem key={length} value={length.toString()}>
                    {length} in
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Price Range Filter */}
          {isApproved && (
            <Select
              value={
                selectedPriceMin && selectedPriceMax
                  ? `${selectedPriceMin}-${selectedPriceMax}`
                  : selectedPriceMin
                    ? `${selectedPriceMin}-`
                    : selectedPriceMax
                      ? `-${selectedPriceMax}`
                      : "clear"
              }
              onValueChange={(value) => {
                if (value === "clear") {
                  handlePriceRangeChange(undefined, undefined)
                } else {
                  const newRange = PRICE_RANGES.find(
                    (r) => `${r.min || ""}-${r.max || ""}` === value
                  )
                  if (newRange) {
                    handlePriceRangeChange(newRange.min, newRange.max)
                  }
                }
              }}
            >
              <SelectTrigger className="w-auto min-w-[120px] h-9 text-sm">
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((range, idx) => {
                  const value =
                    range.min === undefined && range.max === undefined
                      ? "clear"
                      : `${range.min ?? ""}-${range.max ?? ""}`;

                  return (
                    <SelectItem key={idx} value={value}>
                      {range.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 text-sm text-muted-foreground hover:text-foreground"
            >
              <IconX className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Filters - Hamburger Menu */}
      <div className="md:hidden mb-4 flex justify-between items-center">
        <h2 className="text-base font-semibold">Filters</h2>
        <Button
          aria-label={mobileOpen ? "Close filters" : "Open filters"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            mobileOpen ? "bg-secondary/30" : "hover:bg-secondary/10"
          )}
          variant="default"
        >
          {mobileOpen ? <IconX aria-hidden="true" /> : <IconMenu aria-hidden="true" />}
        </Button>
      </div>

      {/* Mobile Filter Panel */}
      {mobileOpen && <div className="md:hidden mb-4 bg-secondary/30 rounded-lg p-4">{MobileFilterContent}</div>}
    </>
  )
}
