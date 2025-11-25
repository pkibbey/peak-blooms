"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";

interface SlugInputProps {
  name: string;
  slug: string;
  onSlugChange: (slug: string) => void;
  disabled?: boolean;
}

export default function SlugInput({
  name,
  slug,
  onSlugChange,
  disabled = false,
}: SlugInputProps) {
  const [isManualEdit, setIsManualEdit] = useState(false);

  // Auto-generate slug from name if not manually edited
  useEffect(() => {
    if (!isManualEdit && name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      
      if (slug !== generatedSlug) {
        onSlugChange(generatedSlug);
      }
    }
  }, [name, isManualEdit, onSlugChange, slug]);

  const handleSlugChange = (value: string) => {
    setIsManualEdit(true);
    // Sanitize slug input
    const sanitizedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+/, "");
    onSlugChange(sanitizedSlug);
  };

  const handleReset = () => {
    setIsManualEdit(false);
    if (name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      onSlugChange(generatedSlug);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="slug">Slug</Label>
      <div className="flex gap-2">
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          disabled={disabled}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="auto-generated-slug"
        />
        {isManualEdit && (
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            Reset
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        URL-friendly identifier. {isManualEdit ? "Manually edited." : "Auto-generated from name."}
      </p>
    </div>
  );
}
