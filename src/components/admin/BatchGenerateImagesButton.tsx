"use client"

import { Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface ProductFilters {
  filterDescription?: "has" | "missing"
  filterImages?: "has" | "missing"
  types?: string[]
}

interface BatchGenerateImagesButtonProps {
  remainingCount: number
  filters?: ProductFilters
}

interface ProgressState {
  isRunning: boolean
  currentProduct: string
  processed: number
  total: number
  successCount: number
}

const BATCH_COUNT = 3

export function BatchGenerateImagesButton({
  remainingCount,
  filters,
}: BatchGenerateImagesButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [progress, setProgress] = useState<ProgressState>({
    isRunning: false,
    currentProduct: "",
    processed: 0,
    total: 0,
    successCount: 0,
  })
  const router = useRouter()

  const totalToGenerate = remainingCount < BATCH_COUNT ? remainingCount : BATCH_COUNT

  const handleBatchGenerate = () => {
    if (remainingCount === 0) return

    // Start the generation immediately (don't use startTransition to allow real-time updates)
    setProgress({
      isRunning: true,
      currentProduct: "",
      processed: 0,
      total: totalToGenerate,
      successCount: 0,
    })

    // Run the generation outside of startTransition for real-time progress updates
    ;(async () => {
      try {
        // Fetch the list of products that need images
        const queryParams = new URLSearchParams()
        if (filters?.filterDescription)
          queryParams.set("filterDescription", filters.filterDescription)
        if (filters?.filterImages) queryParams.set("filterImages", filters.filterImages)
        if (filters?.types && filters.types.length > 0)
          queryParams.set("types", filters.types.join(","))

        const listResp = await fetch(
          `/api/admin/batch-generate-images-list?${queryParams.toString()}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        )

        if (!listResp.ok) {
          const error = await listResp.json()
          toast.error(error.error || "Failed to fetch products")
          setProgress((p) => ({ ...p, isRunning: false }))
          return
        }

        const { products } = await listResp.json()
        const productsToProcess = products.slice(0, totalToGenerate)

        let successCount = 0

        // Process each product sequentially: generate -> upload -> update progress
        for (const product of productsToProcess) {
          setProgress((p) => ({
            ...p,
            currentProduct: product.name,
          }))

          try {
            // Generate images for this product
            const generateResp = await fetch("/api/admin/batch-generate-images-single", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: product.id }),
            })

            if (!generateResp.ok) {
              const error = await generateResp.json()
              toast.error(`Failed to generate for ${product.name}: ${error.error}`)
              setProgress((p) => ({
                ...p,
                processed: p.processed + 1,
              }))
              continue
            }

            const { images } = await generateResp.json()

            if (!images || images.length === 0) {
              setProgress((p) => ({
                ...p,
                processed: p.processed + 1,
              }))
              continue
            }

            let productSuccess = true

            // Upload each generated image
            for (const img of images) {
              try {
                const resp = await fetch(img.imageUrl)
                if (!resp.ok) throw new Error("Failed to fetch generated image data")
                const blob = await resp.blob()

                const { upload } = await import("@vercel/blob/client")
                const timestamp = Date.now()
                const filename = `generated_${product.name.toLowerCase().replace(/\s+/g, "_")}_${timestamp}.jpg`

                const uploaded = await upload(filename, blob, {
                  access: "public",
                  handleUploadUrl: "/api/upload",
                  clientPayload: JSON.stringify({
                    folder: "products/generated",
                    slug: product.name.toLowerCase().replace(/\s+/g, "-"),
                    extension: "jpg",
                  }),
                })

                // Append to product
                const appendResp = await fetch("/api/admin/append-product-image", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ productId: product.id, imageUrl: uploaded.url }),
                })

                if (!appendResp.ok) {
                  const err = await appendResp.json()
                  toast.error(err.error || `Failed to save image for ${product.name}`)
                  productSuccess = false
                }
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                toast.error(`Failed to upload image for ${product.name}: ${msg}`)
                productSuccess = false
              }
            }

            // Update progress after this product is complete
            if (productSuccess) {
              successCount++
            }
            setProgress((p) => ({
              ...p,
              processed: p.processed + 1,
              successCount,
            }))

            // Refresh UI after each product
            startTransition(() => router.refresh())
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            toast.error(`Error processing ${product.name}: ${msg}`)
            setProgress((p) => ({
              ...p,
              processed: p.processed + 1,
            }))
          }
        }

        toast.success(`Generated and saved images for ${successCount} products`)
        setProgress((p) => ({ ...p, isRunning: false }))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred"
        toast.error(errorMessage)
        setProgress((p) => ({ ...p, isRunning: false }))
      }
    })()
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleBatchGenerate}
        disabled={isPending || progress.isRunning || remainingCount === 0}
        title={remainingCount === 0 ? "All products have images" : undefined}
      >
        {isPending || progress.isRunning ? (
          <>
            <span className="mr-2 animate-spin">⟳</span>
            Generating images...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Next {totalToGenerate} Image{totalToGenerate !== 1 && "s"}
          </>
        )}
      </Button>

      {/* Progress Modal */}
      {progress.isRunning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <style>{`
            @keyframes wavingGlow {
              0% {
                transform: translateY(0px);
                text-shadow: 0 0 5px rgba(59, 130, 246, 0.4);
              }
              50% {
                transform: translateY(-6px);
                text-shadow: 0 0 15px rgba(59, 130, 246, 0.8), 0 0 25px rgba(59, 130, 246, 0.5);
              }
              100% {
                transform: translateY(0px);
                text-shadow: 0 0 5px rgba(59, 130, 246, 0.4);
              }
            }
            .glow-char {
              display: inline-block;
              animation: wavingGlow 1.2s ease-in-out infinite;
              position: relative;
            }
          `}</style>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight">
                {"Generating Images".split("").map((char, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Animation
                  <span key={i} className="glow-char" style={{ animationDelay: `${i * 0.08}s` }}>
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </h2>
              <div className="text-sm text-gray-500">
                {progress.processed}/{progress.total}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${progress.total > 0 ? (progress.processed / progress.total) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Current Product */}
            {progress.currentProduct && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Currently processing:</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {progress.currentProduct}
                </p>
              </div>
            )}

            {/* Success Count */}
            <div className="text-sm text-gray-600">
              <span className="font-medium text-green-600">{progress.successCount}</span>{" "}
              successfully saved
            </div>
          </div>
        </div>
      )}
    </>
  )
}
