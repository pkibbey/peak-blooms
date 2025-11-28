"use client"

import { upload } from "@vercel/blob/client"
import { CloudUpload, LoaderCircle, X } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  folder?: string
  label?: string
  required?: boolean
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  folder = "general",
  label = "Image",
  required = false,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, or WebP image.")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 5 MB.")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ folder }),
        onUploadProgress: (progress) => {
          setUploadProgress(progress.percentage)
        },
      })

      onChange(blob.url)
      setImageError(false)
      toast.success("Image uploaded successfully")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      toast.error(message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClear = () => {
    onChange("")
    setImageError(false)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="sr-only"
      />

      {/* Unified drop zone / preview area */}
      {/* biome-ignore lint/a11y/useSemanticElements: Using div for complex drop zone with image preview */}
      <div
        role="button"
        tabIndex={!value && !isUploading ? 0 : -1}
        onClick={!value ? handleClick : undefined}
        onKeyDown={(e) => {
          if (!value && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            handleClick()
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex h-48 w-full max-w-md items-center justify-center overflow-hidden rounded-md border-2 border-dashed transition-colors",
          isDragging && "border-primary bg-primary/5",
          !value &&
            !isUploading &&
            "cursor-pointer hover:border-primary hover:bg-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          value && !imageError && "border-solid border-border",
          imageError && "border-destructive"
        )}
      >
        {/* Uploading state */}
        {isUploading && (
          <div className="flex flex-col items-center gap-3 p-6">
            <LoaderCircle className="size-8 animate-spin text-primary" />
            <div className="w-full max-w-[200px] space-y-1">
              <p className="text-center text-sm text-muted-foreground">
                Uploading... {Math.round(uploadProgress)}%
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!value && !isUploading && (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <CloudUpload className="size-10 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP (max 5 MB)</p>
            </div>
          </div>
        )}

        {/* Image preview */}
        {value && !isUploading && !imageError && (
          <>
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClick()
                }}
              >
                Replace
              </Button>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              className="absolute right-2 top-2"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
            >
              <X />
            </Button>
          </>
        )}

        {/* Error state */}
        {imageError && value && !isUploading && (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <p className="text-sm text-destructive">Failed to load image</p>
            <Button type="button" variant="outline" size="sm" onClick={handleClear}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
