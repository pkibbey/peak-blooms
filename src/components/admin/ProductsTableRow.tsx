"use client"

import { AlertCircle, Check, LoaderCircle, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { toggleProductFeaturedAction } from "@/app/actions/products"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TableCell, TableRow } from "@/components/ui/table"
import type { ProductModel } from "@/generated/models"
import { pickRandomFirstStyle } from "@/lib/ai-prompt-templates"
import { toAppErrorClient } from "@/lib/error-utils"
import { PRODUCT_TYPE_LABELS } from "@/lib/product-types"
import { cn, formatPrice } from "@/lib/utils"
import { ColorsMiniDisplay } from "../ui/ColorsMiniDisplay"

interface ProductRowProps {
  product: ProductModel
}

export default function ProductsTableRow({ product }: ProductRowProps) {
  const priceDisplay = formatPrice(product.price)
  const router = useRouter()
  const [featured, setFeatured] = useState<boolean>(!!product.featured)
  const [isPending, startTransition] = useTransition()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const isProcessing = isGenerating || isUploading

  const handleGenerateImage = async () => {
    try {
      // First image: randomly pick editorial|botanical|garden (mapped to 'lifestyle')
      setIsGenerating(true)
      const firstStyle = pickRandomFirstStyle()

      // Request server-side generation for first image
      const firstGenResp = await fetch("/api/admin/generate-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, styleTemplate: firstStyle }),
      })

      if (!firstGenResp.ok) {
        toast.error("Failed to generate first image")
        setIsGenerating(false)
        return
      }

      const firstGenData = await firstGenResp.json()
      const firstGeneratedImageUrl = firstGenData.imageUrl

      setIsGenerating(false)
      setIsUploading(true)

      // Upload first image
      const firstResponse = await fetch(firstGeneratedImageUrl)
      if (!firstResponse.ok) throw new Error("Failed to fetch generated data URL for first image")
      const firstBlob = await firstResponse.blob()

      const { upload } = await import("@vercel/blob/client")
      const firstTimestamp = Date.now()
      const firstFilename = `generated_${product.name.toLowerCase().replace(/\s+/g, "_")}_${firstTimestamp}.jpg`

      const firstUploadedBlob = await upload(firstFilename, firstBlob, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({
          folder: "generated/images",
          slug: product.name.toLowerCase().replace(/\s+/g, "-"),
          extension: "jpg",
        }),
      })

      // Append first image to product
      const firstAppendResp = await fetch("/api/admin/append-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, imageUrl: firstUploadedBlob.url }),
      })

      if (!firstAppendResp.ok) {
        const err = await firstAppendResp.json()
        toast.error(err.error || "Failed to save first image to product")
        setIsUploading(false)
        return
      }

      toast.success("First image generated and saved")

      // Stop spinner briefly to show first image completed
      setIsUploading(false)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Second image: always realistic
      setIsGenerating(true)

      const secondGenResp = await fetch("/api/admin/generate-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, styleTemplate: "realistic" }),
      })

      if (!secondGenResp.ok) {
        const err = await secondGenResp.json()
        toast.error(err.error || "Failed to generate second image")
        setIsGenerating(false)
        return
      }

      const secondGenData = await secondGenResp.json()
      const secondGeneratedImageUrl = secondGenData.imageUrl

      setIsGenerating(false)
      setIsUploading(true)

      // Upload second image
      const secondResponse = await fetch(secondGeneratedImageUrl)
      if (!secondResponse.ok) throw new Error("Failed to fetch generated data URL for second image")
      const secondBlob = await secondResponse.blob()

      const secondTimestamp = Date.now()
      const secondFilename = `generated_${product.name.toLowerCase().replace(/\s+/g, "_")}_${secondTimestamp}.jpg`

      const secondUploadedBlob = await upload(secondFilename, secondBlob, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({
          folder: "generated/images",
          slug: product.name.toLowerCase().replace(/\s+/g, "-"),
          extension: "jpg",
        }),
      })

      // Append second image to product
      const secondAppendResp = await fetch("/api/admin/append-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, imageUrl: secondUploadedBlob.url }),
      })

      if (!secondAppendResp.ok) {
        const err = await secondAppendResp.json()
        toast.error(err.error || "Failed to save second image to product")
        setIsUploading(false)
        return
      }

      toast.success("Second image generated and saved")
      setIsUploading(false)
      router.refresh()
    } catch (err) {
      toAppErrorClient(err, "Failed to generate image")
      setIsGenerating(false)
      setIsUploading(false)
    }
  }

  return (
    <TableRow key={product.id} className={cn(product.featured && "bg-blue-300/10")}>
      {/* Image */}
      <TableCell>
        <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-muted">
          {product.images && product.images.length > 0 && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          )}

          {(!product.images || product.images.length === 0) && (
            <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center">
              <Button
                onClick={handleGenerateImage}
                disabled={isProcessing}
                size="sm"
                type="button"
                aria-label={`Generate AI image for ${product.name}`}
                className="p-1"
              >
                {isProcessing ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </TableCell>

      {/* Name */}
      <TableCell className="max-w-40 truncate">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="text-primary font-medium hover:underline"
        >
          {product.name}
        </Link>
      </TableCell>

      {/* Price */}
      <TableCell className="hidden lg:table-cell">{priceDisplay}</TableCell>

      {/* Product Type */}
      <TableCell className="hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {PRODUCT_TYPE_LABELS[product.productType]}
        </span>
      </TableCell>

      {/* Featured */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={!!featured}
            onCheckedChange={(value) => {
              const previous = featured
              setFeatured(value)

              startTransition(async () => {
                try {
                  const result = await toggleProductFeaturedAction({
                    id: product.id,
                    featured: value,
                  })
                  if (!result.success) {
                    setFeatured(previous)
                    toast.error(result.error)
                    return
                  }
                  toast.success(
                    `${value ? "Marked featured" : "Removed featured"} - ${product.name}`
                  )
                  router.refresh()
                } catch (_err) {
                  toAppErrorClient(_err, "Failed to update product")
                  setFeatured(previous)
                }
              })
            }}
            disabled={isPending}
            aria-label={`Toggle featured for ${product.name}`}
          />
        </div>
      </TableCell>

      {/* Description */}
      <TableCell className="hidden lg:table-cell">
        {product.description?.trim() ? (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-xs">Yes</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">Missing</span>
          </div>
        )}
      </TableCell>

      {/* Colors */}
      <TableCell className="hidden lg:table-cell">
        <ColorsMiniDisplay colorIds={product.colors} size="md" />
      </TableCell>
    </TableRow>
  )
}
