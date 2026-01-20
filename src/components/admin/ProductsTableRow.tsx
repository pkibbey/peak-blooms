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
      setIsGenerating(true)

      // Step 1: Request server-side generation for this product (server will build prompt)
      const genResp = await fetch("/api/admin/generate-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, styleTemplate: "botanical" }),
      })

      if (!genResp.ok) {
        const err = await genResp.json()
        toast.error(err.error || "Failed to generate image")
        setIsGenerating(false)
        return
      }

      const genData = await genResp.json()
      const generatedImageUrl = genData.imageUrl

      setIsGenerating(false)
      setIsUploading(true)

      // Step 2: Convert data URL to blob and upload to Vercel Blob
      const response = await fetch(generatedImageUrl)
      if (!response.ok) throw new Error("Failed to fetch generated data URL")
      const blob = await response.blob()

      const { upload } = await import("@vercel/blob/client")
      const timestamp = Date.now()
      const filename = `generated_${product.name.toLowerCase().replace(/\s+/g, "_")}_${timestamp}.jpg`

      const uploadedBlob = await upload(filename, blob, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({
          folder: "products/generated",
          slug: product.name.toLowerCase().replace(/\s+/g, "-"),
          extension: "jpg",
        }),
      })

      // Step 3: Append image to product images via admin route
      const appendResp = await fetch("/api/admin/append-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, imageUrl: uploadedBlob.url }),
      })

      if (!appendResp.ok) {
        const err = await appendResp.json()
        toast.error(err.error || "Failed to save image to product")
        setIsUploading(false)
        return
      }

      toast.success("Image generated and saved")
      setIsUploading(false)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Failed to generate image: ${msg}`)
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
          prefetch={false}
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
                  setFeatured(previous)
                  toast.error("Failed to update product")
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
