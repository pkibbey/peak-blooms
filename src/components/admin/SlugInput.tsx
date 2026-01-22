"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SlugInputProps {
  name: string
  slug: string
  onSlugChange: (slug: string) => void
  disabled?: boolean
  onBlur?: () => void
}

export default function SlugInput({
  name,
  slug,
  onSlugChange,
  onBlur,
  disabled = false,
}: SlugInputProps) {
  const [isManualEdit, setIsManualEdit] = useState(false)

  // Auto-generate slug from name if not manually edited
  useEffect(() => {
    if (!isManualEdit && name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      if (slug !== generatedSlug) {
        onSlugChange(generatedSlug)
      }
    }
  }, [name, isManualEdit, onSlugChange, slug])

  const handleSlugChange = (value: string) => {
    setIsManualEdit(true)
    // Sanitize slug input
    const sanitizedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+/, "")
    onSlugChange(sanitizedSlug)
  }

  const handleReset = () => {
    setIsManualEdit(false)
    if (name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      onSlugChange(generatedSlug)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="slug">Slug</Label>
      <div className="flex gap-2">
        <Input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          onBlur={() => onBlur?.()}
          disabled={disabled}
          className="flex-1"
          placeholder="auto-generated-slug"
        />
        {isManualEdit && (
          <Button size="sm" variant="ghost" onClick={handleReset} disabled={disabled}>
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
