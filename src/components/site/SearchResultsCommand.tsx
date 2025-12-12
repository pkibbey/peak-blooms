"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandItem, CommandList } from "@/components/ui/command"
import { PopoverContent } from "@/components/ui/popover"
import type { ProductWithVariantsAndCollection } from "@/lib/types/prisma"

interface SearchResultsCommandProps {
  searchTerm: string
  isOpen: boolean
  onClose: () => void
}

const RESULTS_LIMIT = 10

export function SearchResultsCommand({ searchTerm, isOpen, onClose }: SearchResultsCommandProps) {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithVariantsAndCollection[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !searchTerm.trim()) return

    const fetchResults = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          search: searchTerm,
          limit: RESULTS_LIMIT.toString(),
          offset: "0",
        })
        const response = await fetch(`/api/products?${params}`, { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
          setTotalResults(data.total || 0)
          setHighlightedIndex(data.products && data.products.length > 0 ? 0 : -1)
        }
      } catch (error) {
        console.error("Error fetching search results:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [searchTerm, isOpen])

  const onSelect = (productSlug: string) => {
    onClose()
    router.push(`/shop/${productSlug}`)
  }

  if (!isOpen) return null

  return (
    <PopoverContent className="w-[600px] p-0" align="center" sideOffset={8}>
      <div className="flex flex-col max-h-[500px]">
        <div className="flex items-center justify-between border-b border-b-border p-4">
          <h2 className="font-semibold text-sm">Search Results</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${products.length} of ${totalResults}`}
          </p>
        </div>

        <div className="flex-1 overflow-auto">
          {products.length > 0 ? (
            <Command>
              <CommandList>
                {products.map((p) => (
                  <CommandItem
                    key={p.slug}
                    value={p.slug}
                    onSelect={() => onSelect(p.slug)}
                    className={"flex items-center justify-between gap-3 p-3"}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-12 overflow-hidden rounded-md bg-muted/30">
                        {p.images?.[0] && (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            width={48}
                            height={40}
                            className="h-10 w-12 object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {p.collection?.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-right text-muted-foreground">
                      {p.price != null ? `$${p.price.toFixed(2)}` : "—"}
                    </div>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Searching..." : "No products found"}
              </p>
            </div>
          )}
        </div>

        {totalResults > RESULTS_LIMIT && (
          <div className="border-t border-t-border p-3 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/shop?search=${encodeURIComponent(searchTerm)}`} onClick={onClose}>
                View All {totalResults} Results
              </Link>
            </Button>
          </div>
        )}
      </div>
    </PopoverContent>
  )
}
