"use client"

import { GripVertical, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"
import { ImageSearchPicker } from "@/components/admin/ImageSearchPicker"
import { ImageUpload } from "@/components/admin/ImageUpload"
import { ProductImageGeneratorInline } from "@/components/admin/ProductImageGeneratorInline"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { ProductType } from "@/generated/enums"
import { toAppErrorClient } from "@/lib/error-utils"

interface ProductImageManagerProps {
  productId?: string
  slug: string
  productName: string
  productType: ProductType
  productDescription?: string | null
  initialImages: string[]
  onImagesChange: (images: string[]) => void
}

export function ProductImageManager({
  productId,
  slug,
  productName,
  productType,
  productDescription,
  initialImages,
  onImagesChange,
}: ProductImageManagerProps) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const updateImages = (newImages: string[]) => {
    // Re-order based on index
    setImages(newImages)
    onImagesChange(newImages)
  }

  const handleAddImage = (url: string) => {
    const newImages = [...images, url]
    updateImages(newImages)
    toast.success("Image added successfully")
  }

  const handleDeleteImage = async (index: number) => {
    const imageUrl = images[index]
    setIsDeleting(imageUrl)

    try {
      // If product exists and image was already saved, delete from server
      if (productId && imageUrl) {
        const response = await fetch(`/api/delete-image`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            imageUrl,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to delete image")
        }

        if (!result.success) {
          throw new Error(result.error || "Failed to delete image")
        }

        if (result.blobDeleted === false) {
          // Blob cleanup failed on server (e.g., missing token). Remove reference but warn admin.
          toast.warning(result.warning || "Image reference removed but blob deletion failed")
        }
      }

      const newImages = images.filter((_, i) => i !== index)
      updateImages(newImages)
      toast.success("Image removed successfully")
    } catch (error) {
      toAppErrorClient(error, "Failed to delete image")
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(targetIndex, 0, draggedImage)

    updateImages(newImages)
    setDraggedIndex(targetIndex)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4">
      <Label>Product Images</Label>
      <p className="text-sm text-muted-foreground">
        Drag to reorder. First image is displayed on product cards. Add multiple images to show on
        product detail page.
      </p>

      {/* Image List */}
      <div className="space-y-3">
        {images.length > 0 ? (
          images.map((image, index) => (
            <div
              key={image}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 border rounded-md transition-colors ${
                draggedIndex === index ? "bg-muted opacity-50" : "bg-background hover:bg-muted/50"
              }`}
            >
              {/* Drag Handle */}
              <GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

              {/* Image Thumbnail */}
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border">
                <Image
                  src={image}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              {/* Image Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{`Image ${index + 1}${
                  index === 0 ? " (Primary)" : index === 1 ? " (Hover)" : ""
                }`}</p>
                <p className="text-xs text-muted-foreground truncate">{image}</p>
              </div>

              {/* Delete Button */}
              <Button
                variant="outline-destructive"
                size="sm"
                onClick={() => handleDeleteImage(index)}
                disabled={isDeleting === image}
                aria-label={`Delete image ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground italic">No images added yet</p>
        )}
      </div>

      {/* Add Image Actions */}
      <div className="flex flex-col md:flex-row flex-wrap gap-6">
        {/* Upload Image */}
        <div>
          <ImageUpload
            value=""
            onChange={handleAddImage}
            folder="products"
            slug={slug}
            label="Upload Image"
            showLabel={false}
            multiple
            addRandomSuffix
          />
        </div>

        {/* Generate Image with AI */}
        <ProductImageGeneratorInline
          productName={productName}
          productType={productType}
          productDescription={productDescription}
          onImageSaved={handleAddImage}
          buttonLabel="Generate Image"
        />
      </div>

      {/* Search for Image from APIs */}
      <ImageSearchPicker
        productName={productName}
        productType={productType}
        onImageSelected={handleAddImage}
      />

      {/* Max Images Warning */}
      {images.length >= 10 && (
        <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          Maximum 10 images per product. Remove an image to add a new one.
        </div>
      )}
    </div>
  )
}
