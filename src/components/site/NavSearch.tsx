"use client"

import Image from "next/image"
import Link from "next/link"
import React, { useTransition } from "react"
import { searchProducts } from "@/app/actions/search"
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
  const [searchValue, setSearchValue] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<ProductHit[]>([])
  const [isPending, startTransition] = useTransition()

  const fetchResults = useDebouncedCallback((q: unknown) => {
    const term = typeof q === "string" ? q.trim() : ""
    if (!term) {
      setSearchResults([])
      return
    }

    startTransition(async () => {
      try {
        const result = await searchProducts({ searchTerm: term })
        if (!result.success) {
          setSearchResults([])
          return
        }
        setSearchResults(result.data.products)
      } catch {
        setSearchResults([])
      }
    })
  }, 300)

  React.useEffect(() => {
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
            className="bg-background/50 pe-8"
          />
          <AutocompleteClear className="absolute right-2 top-1/2 -translate-y-1/2" />
        </div>
        <AutocompletePositioner sideOffset={6}>
          <AutocompletePopup className="p-0">
            <AutocompleteStatus className="text-center">
              {isPending ? "Loading..." : null}
            </AutocompleteStatus>
            <AutocompleteEmpty>No products found</AutocompleteEmpty>
            <AutocompleteList className="not-empty:p-0">
              {(result: ProductHit) => (
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
