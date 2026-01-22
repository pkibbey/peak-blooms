"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import FadeImage from "@/components/site/FadeImage"
import { Button } from "@/components/ui/button"

// Layout constants
const GALLERY_HEIGHT_SM = "h-[420px]"
const GALLERY_HEIGHT_MD = "md:h-[680px]"
const THUMBNAIL_SIZE = "w-16 h-16"
const CONTAINER_GAP = "gap-4"
const THUMBNAIL_GAP = "gap-2"
const NAV_BUTTON_BASE_CLASS =
  "absolute top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"

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
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  if (imageList.length === 0) {
    return (
      <div
        className={`relative w-full ${GALLERY_HEIGHT_SM} ${GALLERY_HEIGHT_MD} overflow-hidden rounded-xs bg-zinc-200`}
      />
    )
  }

  const displayIndex = hoverIndex ?? currentImageIndex
  const currentImage = imageList[displayIndex]
  const hasMultipleImages = imageList.length > 1

  const goToPrevious = () => {
    if (isLoading) return
    setIsLoading(true)
    setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1))
  }

  const goToNext = () => {
    if (isLoading) return
    setIsLoading(true)
    setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1))
  }

  // Handle keyboard navigation (only for multiple images)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasMultipleImages) return
    if (e.key === "ArrowLeft") goToPrevious()
    if (e.key === "ArrowRight") goToNext()
  }

  return (
    <div className={`flex flex-col ${CONTAINER_GAP}`}>
      {/* Main Image Container */}
      {/** biome-ignore lint/a11y/useSemanticElements: Main image*/}
      <div
        className={`relative w-full ${GALLERY_HEIGHT_SM} ${GALLERY_HEIGHT_MD} overflow-hidden rounded-xs bg-zinc-200 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary`}
        onKeyDown={hasMultipleImages ? handleKeyDown : undefined}
        tabIndex={hasMultipleImages ? 0 : undefined}
        role="region"
        aria-label={`Image gallery showing ${currentImageIndex + 1} of ${imageList.length} images`}
        aria-busy={isLoading}
      >
        <FadeImage
          src={currentImage.url}
          alt={`${productName} - Image ${currentImageIndex + 1}`}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={currentImageIndex === 0}
          duration={200}
          className="absolute inset-0"
          onLoadComplete={(src) => {
            if (src === currentImage.url) setIsLoading(false)
          }}
        />

        {/* Navigation Controls - Only show if multiple images */}
        {hasMultipleImages && (
          <>
            {/* Previous Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className={`${NAV_BUTTON_BASE_CLASS} left-2`}
              aria-label="Previous image"
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Next Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className={`${NAV_BUTTON_BASE_CLASS} right-2`}
              aria-label="Next image"
              disabled={isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Image Counter */}
            <div
              className="absolute bottom-2 right-2 z-10 bg-background/80 rounded px-2 py-1 text-sm font-medium"
              aria-live="polite"
              aria-atomic="true"
            >
              {currentImageIndex + 1} / {imageList.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {hasMultipleImages && (
        <div className={`flex ${THUMBNAIL_GAP} overflow-x-auto pb-2`}>
          {imageList.map((image, index) => (
            <Button
              key={image.url}
              onClick={() => {
                if (isLoading) return
                setIsLoading(true)
                setCurrentImageIndex(index)
              }}
              onMouseEnter={() => !isLoading && setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              className={`relative flex-shrink-0 ${THUMBNAIL_SIZE} rounded border-2 overflow-hidden transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                index === displayIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground"
              }`}
              aria-label={`Go to image ${index + 1}`}
              aria-current={index === currentImageIndex}
              disabled={isLoading}
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
