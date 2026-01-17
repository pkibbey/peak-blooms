"use client"

import { LoaderCircle, Zap } from "lucide-react"
import Image from "next/image"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ProductType } from "@/generated/enums"
import { getAvailableTemplates, type StyleTemplate } from "@/lib/ai-prompt-templates"
import { Input } from "../ui/input"

interface ProductImageSelectorInlineProps {
  productName: string
  productType: ProductType
  productDescription?: string | null
  onSelectImage: (imageUrl: string) => void
}

export function ProductImageSelectorInline({
  productName,
  productType,
  productDescription,
  onSelectImage,
}: ProductImageSelectorInlineProps) {
  const [selectedStyle, setSelectedStyle] = useState<StyleTemplate>("botanical")
  const [flowerDescription, setFlowerDescription] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleGenerateImage = useCallback(async () => {
    try {
      setIsGenerating(true)
      console.log("[Image Generation] Starting with:", {
        productName,
        productType,
        selectedStyle,
      })

      const response = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          productType,
          styleTemplate: selectedStyle,
          description: flowerDescription || productDescription,
        }),
      })

      console.log("[Image Generation] Response status:", response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json()
        console.error("[Image Generation] API error:", error)
        toast.error(error.error || "Failed to generate image")
        return
      }

      const data = await response.json()
      console.log(
        "[Image Generation] Successfully generated, URL length:",
        data.imageUrl?.length || "unknown"
      )
      setGeneratedImage(data.imageUrl)
      toast.success("Image generated successfully")
    } catch (err) {
      console.error("[Image Generation] Exception:", err instanceof Error ? err.message : err)
      toast.error("Error generating image")
    } finally {
      setIsGenerating(false)
    }
  }, [productName, productType, productDescription, selectedStyle, flowerDescription])

  const handleSelectGeneratedImage = useCallback(
    async (imageUrl: string) => {
      try {
        // Immediately hide the generated image and show loading state
        setGeneratedImage(null)
        setIsUploading(true)

        console.log("[Generated Image Upload] Starting with image size:", imageUrl.length)

        // Convert data URL to blob and upload to Vercel Blob
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch data URL: ${response.status} ${response.statusText}`)
        }
        const blob = await response.blob()
        console.log("[Generated Image Upload] Blob created, size:", blob.size, "type:", blob.type)

        // Use Vercel Blob upload to persist the image
        const { upload } = await import("@vercel/blob/client")
        console.log("[Generated Image Upload] Vercel Blob client loaded")

        // Generate a unique filename based on product name and timestamp
        const timestamp = Date.now()
        const filename = `generated_${productName.toLowerCase().replace(/\s+/g, "_")}_${timestamp}.jpg`
        console.log("[Generated Image Upload] Uploading with filename:", filename)

        const uploadedBlob = await upload(filename, blob, {
          access: "public",
          handleUploadUrl: "/api/upload",
          clientPayload: JSON.stringify({
            folder: "products",
            slug: productName.toLowerCase().replace(/\s+/g, "-"),
            extension: "jpg",
          }),
        })

        console.log("[Generated Image Upload] Successfully uploaded to:", uploadedBlob.url)
        onSelectImage(uploadedBlob.url)
        setIsUploading(false)
        toast.success("Generated image uploaded successfully")
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error("[Generated Image Upload] Error:", errorMessage)
        toast.error(`Failed to upload generated image: ${errorMessage}`)
        setIsUploading(false)
      }
    },
    [productName, onSelectImage]
  )

  const allTemplates = getAvailableTemplates()

  return (
    <div className="space-y-6 border-y py-6">
      <h3 className="font-semibold text-lg">Browse & Generate Images</h3>

      <div className="grid grid-cols-2 gap-4 items-end rounded border p-4 bg-muted/50">
        <div className="grid gap-2">
          <Label htmlFor="style-template">Style Template</Label>
          <Select
            value={selectedStyle}
            onValueChange={(value) => setSelectedStyle(value as StyleTemplate)}
          >
            <SelectTrigger id="style-template">
              <SelectValue />
            </SelectTrigger>
            <SelectPositioner alignItemWithTrigger>
              <SelectContent>
                {allTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-semibold">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectPositioner>
          </Select>
        </div>

        <Button onClick={handleGenerateImage} disabled={isGenerating} className="col-span-2 w-full">
          {isGenerating ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Generate with LM Studio
            </>
          )}
        </Button>

        {generatedImage && !isUploading && (
          <div className="space-y-2">
            <div className="relative aspect-square rounded border overflow-hidden max-w-sm">
              <Image
                src={generatedImage}
                alt={`Generated ${productName}`}
                fill
                className="object-cover"
              />
            </div>
            <Button
              type="button"
              onClick={() => handleSelectGeneratedImage(generatedImage)}
              className="w-full"
              disabled={isUploading}
            >
              Use Generated Image
            </Button>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="relative aspect-square rounded border overflow-hidden max-w-sm bg-muted flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Uploading...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
