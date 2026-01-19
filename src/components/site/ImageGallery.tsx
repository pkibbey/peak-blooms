"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ImageGalleryProps {
  images: { url: string; order: number }[]
  productName: string
  fallbackImage?: string
}

export function ImageGallery({ images, productName, fallbackImage }: ImageGalleryProps) {
  // Use new images array, fallback to single image if needed
  const imageList =
    images.length > 0
      ? images.sort((a, b) => a.order - b.order)
      : fallbackImage
        ? [{ url: fallbackImage, order: 0 }]
        : []
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (imageList.length === 0) {
    return <div className="relative w-full aspect-square overflow-hidden rounded-xs bg-zinc-200" />
  }

  const currentImage = imageList[currentImageIndex]
  const hasMultipleImages = imageList.length > 1

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1))
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious()
    if (e.key === "ArrowRight") goToNext()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      {/** biome-ignore lint/a11y/useSemanticElements: Main image*/}
      <div
        className="relative w-full aspect-square overflow-hidden rounded-xs bg-zinc-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
        onKeyDown={handleKeyDown}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: tab access
        tabIndex={0}
        role="region"
        aria-label={`Image gallery showing ${currentImageIndex + 1} of ${imageList.length} images`}
      >
        <Image
          src={currentImage.url}
          alt={`${productName} - Image ${currentImageIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority={currentImageIndex === 0}
        />

        {/* Navigation Controls - Only show if multiple images */}
        {hasMultipleImages && (
          <>
            {/* Previous Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Next Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-2 right-2 bg-background/80 rounded px-2 py-1 text-sm font-medium">
              {currentImageIndex + 1} / {imageList.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {imageList.map((image, index) => (
            <Button
              key={image.url}
              onClick={() => setCurrentImageIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-colors ${
                index === currentImageIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground"
              }`}
              aria-label={`Go to image ${index + 1}`}
              aria-current={index === currentImageIndex}
            >
              <Image
                src={image.url}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
