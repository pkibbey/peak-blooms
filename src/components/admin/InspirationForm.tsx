"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { ImageUpload } from "@/components/admin/ImageUpload"
import ProductMultiSelect from "@/components/admin/ProductMultiSelect"
import SlugInput from "@/components/admin/SlugInput"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ProductVariant {
  id: string
  price: number
  stemLength: number | null
  countPerBunch: number | null
}

interface Product {
  id: string
  name: string
  collection?: {
    name: string
  }
  variants?: ProductVariant[]
}

interface ProductSelection {
  productId: string
  productVariantId: string
}

interface InspirationFormProps {
  products: Product[]
  inspiration?: {
    id: string
    name: string
    slug: string
    subtitle: string
    image: string
    excerpt: string
    inspirationText: string
    products: Array<{
      productId: string
      productVariantId: string
    }>
  }
}

export default function InspirationForm({ products, inspiration }: InspirationFormProps) {
  const router = useRouter()
  const isEditing = !!inspiration

  // Track original image URL to clean up old blob when image changes
  const [originalImage] = useState(inspiration?.image || "")

  const [formData, setFormData] = useState({
    name: inspiration?.name || "",
    slug: inspiration?.slug || "",
    subtitle: inspiration?.subtitle || "",
    image: inspiration?.image || "",
    excerpt: inspiration?.excerpt || "",
    inspirationText: inspiration?.inspirationText || "",
  })

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    inspiration?.products?.map((p) => p.productId) || []
  )

  const [productSelections, setProductSelections] = useState<ProductSelection[]>(
    inspiration?.products?.map((p) => ({
      productId: p.productId,
      productVariantId: p.productVariantId,
    })) || []
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const url = isEditing ? `/api/inspirations/${inspiration.id}` : "/api/inspirations"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          productSelections: productSelections,
        }),
      })

      if (response.ok) {
        toast.success(
          isEditing ? "Inspiration updated successfully" : "Inspiration created successfully"
        )
        router.push("/admin/inspirations")
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to save inspiration")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const productCount = inspiration?.products?.length || 0
    const warningMessage =
      productCount > 0
        ? `Are you sure you want to delete "${inspiration?.name}"? This inspiration has ${productCount} product${productCount !== 1 ? "s" : ""} associated. This action cannot be undone.`
        : `Are you sure you want to delete "${inspiration?.name}"? This action cannot be undone.`

    if (!window.confirm(warningMessage)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/inspirations/${inspiration?.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Inspiration deleted successfully")
        router.push("/admin/inspirations")
        router.refresh()
      } else {
        setError("Failed to delete inspiration. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Inspiration name"
          />
        </div>

        {/* Slug */}
        <SlugInput
          name={formData.name}
          slug={formData.slug}
          onSlugChange={(slug) => setFormData((prev) => ({ ...prev, slug }))}
        />
      </div>

      {/* Subtitle */}
      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle *</Label>
        <Input
          id="subtitle"
          name="subtitle"
          type="text"
          required
          value={formData.subtitle}
          onChange={handleChange}
          placeholder="A short, catchy subtitle"
        />
      </div>

      {/* Image */}
      <ImageUpload
        value={formData.image}
        onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
        folder="inspiration"
        slug={formData.slug}
        previousUrl={originalImage}
        label="Image"
        aspectRatio="16:9"
        required
      />

      {/* Excerpt */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">Short Excerpt *</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          required
          value={formData.excerpt}
          onChange={handleChange}
          rows={3}
          placeholder="A brief description for previews and cards..."
        />
      </div>

      {/* Inspiration Text */}
      <div className="space-y-2">
        <Label htmlFor="inspirationText">Full Inspiration Text *</Label>
        <Textarea
          id="inspirationText"
          name="inspirationText"
          required
          value={formData.inspirationText}
          onChange={handleChange}
          rows={6}
          placeholder="The full story or description for the inspiration page..."
        />
      </div>

      {/* Products */}
      <div className="space-y-2">
        <Label>Products in Inspiration</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Select products and choose a specific variant for each (used when adding all to cart)
        </p>
        <ProductMultiSelect
          products={products}
          selectedIds={selectedProductIds}
          onChange={setSelectedProductIds}
          productSelections={productSelections}
          onSelectionsChange={setProductSelections}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-between">
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            Save Inspiration
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/inspirations">Cancel</Link>
          </Button>
        </div>
        {isEditing && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            Delete Inspiration
          </Button>
        )}
      </div>
    </form>
  )
}
