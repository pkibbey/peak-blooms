"use client"

import { LoaderCircle, Sparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { ProductType } from "@/generated/enums"
import { toAppErrorClient } from "@/lib/error-utils"

interface GenerateDescriptionButtonProps {
  productName: string
  productType: ProductType
  existingDescription?: string
  onDescriptionGenerated: (description: string) => void
  disabled?: boolean
}

export function GenerateDescriptionButton({
  productName,
  productType,
  existingDescription,
  onDescriptionGenerated,
  disabled = false,
}: GenerateDescriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateDescription = async () => {
    if (!productName.trim()) {
      toast.error("Please enter a product name first")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName,
          productType,
          existingDescription: existingDescription || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate description")
      }

      const data = await response.json()
      if (data.success && data.description) {
        onDescriptionGenerated(data.description)
        toast.success("Description generated successfully")
      } else {
        throw new Error("No description generated")
      }
    } catch (error) {
      toAppErrorClient(error, "Failed to generate description")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerateDescription}
      disabled={disabled || isLoading || !productName.trim()}
      className="w-auto"
    >
      {isLoading ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate with AI
        </>
      )}
    </Button>
  )
}
