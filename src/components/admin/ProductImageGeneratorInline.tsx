"use client"

import { LoaderCircle, Zap } from "lucide-react"
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

interface ProductImageGeneratorInlineProps {
  productName: string
  productType: ProductType
  productDescription?: string | null
  onImageSaved: (imageUrl: string) => void
  buttonLabel?: string
}

export function ProductImageGeneratorInline({
  productName,
  productType,
  productDescription,
  onImageSaved,
  buttonLabel = "Generate Image",
}: ProductImageGeneratorInlineProps) {
  const [selectedStyle, setSelectedStyle] = useState<StyleTemplate>("botanical")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>("")

  const handleGenerateAndSave = useCallback(async () => {
    try {
      setIsGenerating(true)
      setStatusMessage("Generating image...")

      // Step 1: Generate image
      const generateResponse = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          productType,
          styleTemplate: selectedStyle,
          description: productDescription,
        }),
      })

      if (!generateResponse.ok) {
        const error = await generateResponse.json()
        toast.error(error.error || "Failed to generate image")
        setStatusMessage("")
        return
      }

      const data = await generateResponse.json()
      const generatedImageUrl = data.imageUrl

      setIsGenerating(false)
      setIsUploading(true)
      setStatusMessage("Uploading image...")

      // Step 2: Convert data URL to blob and upload to Vercel Blob
      const response = await fetch(generatedImageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch data URL: ${response.status} ${response.statusText}`)
      }
      const blob = await response.blob()

      // Use Vercel Blob upload to persist the image
      const { upload } = await import("@vercel/blob/client")

      // Generate a unique filename based on product name and timestamp
      const timestamp = Date.now()
      const filename = `generated_${productName.toLowerCase().replace(/\s+/g, "_")}_${timestamp}.jpg`

      const uploadedBlob = await upload(filename, blob, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({
          folder: "products/generated",
          slug: productName.toLowerCase().replace(/\s+/g, "-"),
          extension: "jpg",
        }),
      })

      onImageSaved(uploadedBlob.url)
      setStatusMessage("")
      setIsUploading(false)
      toast.success("Image generated and saved successfully")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to generate and save image: ${errorMessage}`)
      setStatusMessage("")
      setIsGenerating(false)
      setIsUploading(false)
    }
  }, [productName, productType, productDescription, selectedStyle, onImageSaved])

  const allTemplates = getAvailableTemplates()
  const isProcessing = isGenerating || isUploading

  return (
    <div className="shrink-0 space-y-4">
      <Label htmlFor="generation-style-template">AI Image Style</Label>
      <div className="flex flex-wrap gap-2">
        <Select
          value={selectedStyle}
          onValueChange={(value) => setSelectedStyle(value as StyleTemplate)}
          disabled={isProcessing}
        >
          <SelectTrigger id="generation-style-template">
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
        <div>
          <Button onClick={handleGenerateAndSave} disabled={isProcessing} type="button">
            {isProcessing ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                {isGenerating ? "Generating..." : "Uploading..."}
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {buttonLabel}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {statusMessage && (
          <div className="text-sm text-muted-foreground text-center">{statusMessage}</div>
        )}
      </div>
    </div>
  )
}
