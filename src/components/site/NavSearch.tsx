"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  Autocomplete,
  AutocompleteClear,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
  AutocompletePositioner,
  AutocompleteStatus,
} from "@/components/ui/autocomplete"
import type { Product } from "@/generated/client"
import { useDebouncedCallback } from "@/lib/useDebouncedCallback"
import { formatPrice } from "@/lib/utils"

interface ProductHit {
  id: string
  name: string
  slug: string
  image?: string | null
  price: number
}

export default function NavSearch() {
  const [searchValue, setSearchValue] = useState("")
  const [searchResults, setSearchResults] = useState<ProductHit[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchResults = useDebouncedCallback(async (q: unknown) => {
    const term = typeof q === "string" ? q.trim() : ""
    if (!term) {
      setSearchResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(term)}`, {
        cache: "no-store",
      })
      const json = await res.json()
      setSearchResults(json.products ?? [])
    } catch {
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }, 300)

  useEffect(() => {
    fetchResults(searchValue)
  }, [searchValue, fetchResults])

  return (
    <div className="relative w-full max-w-md">
      <Autocomplete items={searchResults}>
        <div className="flex items-center gap-2 relative">
          <AutocompleteInput
            id="tags"
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pe-8"
          />
          <AutocompleteClear className="absolute right-2 top-1/2 -translate-y-1/2" />
        </div>
        <AutocompletePositioner sideOffset={6}>
          <AutocompletePopup className="p-0">
            <AutocompleteStatus className="text-center">
              {isLoading ? "Loading..." : null}
            </AutocompleteStatus>
            <AutocompleteEmpty>No products found</AutocompleteEmpty>
            <AutocompleteList className="not-empty:p-0">
              {(result: Product) => (
                <AutocompleteItem key={result.id} value={result.id} className="p-0">
                  <Link
                    href={`/shop/${result.slug}`}
                    className="flex w-full gap-3 py-2 px-3 hover:bg-gray-50"
                    prefetch={false}
                  >
                    {result.image && (
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src={result.image}
                          alt={result.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.name}</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(result.price)}</p>
                    </div>
                  </Link>
                </AutocompleteItem>
              )}
            </AutocompleteList>
          </AutocompletePopup>
        </AutocompletePositioner>
      </Autocomplete>
    </div>
  )
}
