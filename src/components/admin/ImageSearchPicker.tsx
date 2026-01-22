"use client"

import { LoaderCircle, Search } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { searchProductImages, triggerUnsplashDownload } from "@/app/actions/search-images"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toAppErrorClient } from "@/lib/error-utils"
import type { ImageSearchResult } from "@/lib/image-cache"

interface ImageSearchPickerProps {
  productName: string
  productType: string
  onImageSelected: (url: string) => void
}

export function ImageSearchPicker({
  productName,
  productType,
  onImageSelected,
}: ImageSearchPickerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    pixabay: ImageSearchResult[]
    unsplash: ImageSearchResult[]
    pexels: ImageSearchResult[]
  } | null>(null)

  const handleSearch = useCallback(async () => {
    try {
      setLoading(true)
      const result = await searchProductImages(productName, productType)

      if (!result.success) {
        toast.error(result.error || "Failed to search for images")
        return
      }

      setSearchResults({
        pixabay: result.data?.pixabay.images || [],
        unsplash: result.data?.unsplash.images || [],
        pexels: result.data?.pexels.images || [],
      })
    } catch (error) {
      toAppErrorClient(error, "Failed to search for images")
    } finally {
      setLoading(false)
    }
  }, [productName, productType])

  const handleSelectImage = async (image: ImageSearchResult) => {
    try {
      // Trigger Unsplash download tracking if needed
      if (image.source === "unsplash" && image.downloadUrl) {
        await triggerUnsplashDownload(image.downloadUrl)
      }

      onImageSelected(image.url)
      setOpen(false)
      setSearchResults(null)
      toast.success("Image selected successfully")
    } catch (error) {
      toAppErrorClient(error, "Failed to select image")
    }
  }

  // Auto-search when dialog opens
  useEffect(() => {
    if (open && !searchResults) {
      handleSearch()
    }
  }, [open, searchResults, handleSearch])

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Search className="h-4 w-4" />
        Search Images
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search for Product Images</DialogTitle>
            <DialogDescription>
              Search from Pixabay, Unsplash, and Pexels to find the perfect image for{" "}
              <span className="font-semibold text-foreground">{productName}</span>
            </DialogDescription>
          </DialogHeader>

          {!searchResults ? (
            <div className="flex items-center justify-center py-12">
              {loading ? (
                <div className="text-center space-y-2">
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Searching images...</p>
                </div>
              ) : (
                <Button onClick={handleSearch} size="lg">
                  Search for Images
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pixabay Results */}
              <ImageSourceSection
                title="Pixabay"
                images={searchResults.pixabay}
                onSelectImage={handleSelectImage}
              />

              {/* Unsplash Results */}
              <ImageSourceSection
                title="Unsplash"
                images={searchResults.unsplash}
                onSelectImage={handleSelectImage}
              />

              {/* Pexels Results */}
              <ImageSourceSection
                title="Pexels"
                images={searchResults.pexels}
                onSelectImage={handleSelectImage}
              />

              {/* Empty State */}
              {searchResults.pixabay.length === 0 &&
                searchResults.unsplash.length === 0 &&
                searchResults.pexels.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No images found. Try a different search term.
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

interface ImageSourceSectionProps {
  title: string
  images: ImageSearchResult[]
  onSelectImage: (image: ImageSearchResult) => void
}

function ImageSourceSection({ title, images, onSelectImage }: ImageSourceSectionProps) {
  if (images.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="grid grid-cols-3 gap-3">
        {images.map((image) => (
          <button
            key={image.url}
            type="button"
            className="group relative aspect-square overflow-hidden rounded-lg border cursor-pointer hover:border-primary transition-colors"
            onClick={() => onSelectImage(image)}
            aria-label={`Select ${image.attribution}`}
          >
            <Image
              src={image.url}
              alt={image.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              sizes="(max-width: 768px) 150px, 200px"
            />

            {/* Overlay with info */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-end p-2">
              <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity w-full">
                <p className="truncate font-medium">{image.attribution}</p>
                <p className="text-xs text-gray-300 truncate">{image.title}</p>
              </div>
            </div>

            {/* Select Indicator */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-primary text-primary-foreground rounded-full p-1.5">
                <Search className="h-3 w-3" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
