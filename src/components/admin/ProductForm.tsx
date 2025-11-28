"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { ImageUpload } from "@/components/admin/ImageUpload"
import SlugInput from "@/components/admin/SlugInput"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { IconPlus, IconTrash } from "../ui/icons"

interface Collection {
  id: string
  name: string
}

interface ProductVariant {
  id?: string
  price: string
  stemLength: string
  countPerBunch: string
  isBoxlot: boolean
}

interface ProductFormProps {
  collections: Collection[]
  product?: {
    id: string
    name: string
    slug: string
    description: string | null
    image: string | null
    color: string | null
    collectionId: string
    featured: boolean
    variants?: {
      id: string
      price: number
      stemLength: number | null
      countPerBunch: number | null
      isBoxlot: boolean
    }[]
  }
}

// Separate component to manage local state for each variant row
// This prevents re-renders of all variants when typing in one field
interface VariantRowProps {
  variant: ProductVariant
  index: number
  onUpdate: (index: number, variant: ProductVariant) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

function VariantRow({ variant, index, onUpdate, onRemove, canRemove }: VariantRowProps) {
  const [localVariant, setLocalVariant] = useState(variant)

  // Sync local state when parent variant changes (e.g., after form reset)
  useEffect(() => {
    setLocalVariant(variant)
  }, [variant])

  const handleFieldChange = (field: keyof ProductVariant, value: string | boolean) => {
    setLocalVariant((prev) => ({ ...prev, [field]: value }))
  }

  const handleBlur = useCallback(() => {
    onUpdate(index, localVariant)
  }, [index, localVariant, onUpdate])

  const handleCheckboxChange = (checked: boolean) => {
    const updated = { ...localVariant, isBoxlot: checked }
    setLocalVariant(updated)
    onUpdate(index, updated)
  }

  return (
    <div className="grid gap-4 md:grid-cols-5 items-end p-4 border border-border rounded-md bg-muted/30">
      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor={`variant-price-${index}`}>Price *</Label>
        <Input
          id={`variant-price-${index}`}
          type="number"
          step="0.01"
          min="0"
          value={localVariant.price}
          onChange={(e) => handleFieldChange("price", e.target.value)}
          onBlur={handleBlur}
          placeholder="0.00"
        />
      </div>

      {/* Stem Length */}
      <div className="space-y-2">
        <Label htmlFor={`variant-stemLength-${index}`}>Stem Length (cm)</Label>
        <Input
          id={`variant-stemLength-${index}`}
          type="number"
          min="0"
          value={localVariant.stemLength}
          onChange={(e) => handleFieldChange("stemLength", e.target.value)}
          onBlur={handleBlur}
          placeholder="e.g., 50"
        />
      </div>

      {/* Count Per Bunch */}
      <div className="space-y-2">
        <Label htmlFor={`variant-countPerBunch-${index}`}>Stems Per Bunch</Label>
        <Input
          id={`variant-countPerBunch-${index}`}
          type="number"
          min="0"
          value={localVariant.countPerBunch}
          onChange={(e) => handleFieldChange("countPerBunch", e.target.value)}
          onBlur={handleBlur}
          placeholder="e.g., 10"
        />
      </div>

      {/* Boxlot Checkbox */}
      <div className="flex items-center gap-2 h-10">
        <Checkbox
          id={`variant-isBoxlot-${index}`}
          checked={localVariant.isBoxlot}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
        />
        <Label htmlFor={`variant-isBoxlot-${index}`} className="cursor-pointer text-sm">
          Boxlot (Bulk)
        </Label>
      </div>

      {/* Remove Button */}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white disabled:opacity-50"
        >
          <IconTrash className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  )
}

export default function ProductForm({ collections, product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    image: product?.image || "",
    color: product?.color || "",
    collectionId: product?.collectionId || "",
    featured: product?.featured || false,
  })

  const [variants, setVariants] = useState<ProductVariant[]>(() => {
    if (product?.variants && product.variants.length > 0) {
      return product.variants.map((v) => ({
        id: v.id,
        price: v.price.toString(),
        stemLength: v.stemLength?.toString() || "",
        countPerBunch: v.countPerBunch?.toString() || "",
        isBoxlot: v.isBoxlot || false,
      }))
    }
    // Start with one empty variant for new products
    return [{ price: "", stemLength: "", countPerBunch: "", isBoxlot: false }]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validate at least one variant with a price
    const validVariants = variants.filter((v) => v.price.trim() !== "")
    if (validVariants.length === 0) {
      setError("At least one variant with a price is required")
      setIsSubmitting(false)
      return
    }

    try {
      const url = isEditing ? `/api/products/${product.id}` : "/api/products"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          variants: validVariants.map((v) => ({
            price: parseFloat(v.price),
            stemLength: v.stemLength ? parseInt(v.stemLength) : null,
            countPerBunch: v.countPerBunch ? parseInt(v.countPerBunch) : null,
            isBoxlot: v.isBoxlot,
          })),
        }),
      })

      if (response.ok) {
        toast.success(isEditing ? "Product updated successfully" : "Product created successfully")
        router.push("/admin/products")
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to save product")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleVariantUpdate = useCallback((index: number, updatedVariant: ProductVariant) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? updatedVariant : v)))
  }, [])

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { price: "", stemLength: "", countPerBunch: "", isBoxlot: false },
    ])
  }

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${product?.name}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/products/${product?.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Product deleted successfully")
        router.push("/admin/products")
        router.refresh()
      } else {
        setError("Failed to delete product. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
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
            placeholder="Product name"
          />
        </div>

        {/* Slug */}
        <SlugInput
          name={formData.name}
          slug={formData.slug}
          onSlugChange={(slug) => setFormData((prev) => ({ ...prev, slug }))}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Product description..."
        />
      </div>

      {/* Image */}
      <ImageUpload
        value={formData.image}
        onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
        folder="products"
        label="Image"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Color */}
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            name="color"
            type="text"
            value={formData.color}
            onChange={handleChange}
            placeholder="e.g., Red, Pink, White"
          />
        </div>

        {/* Collection */}
        <div className="space-y-2">
          <Label htmlFor="collectionId">Collection *</Label>
          <Select
            value={formData.collectionId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, collectionId: value }))}
          >
            <SelectTrigger id="collectionId" className="w-full">
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              {collections.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Variants Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Variants *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <IconPlus className="h-4 w-4 mr-1" />
            Add Variant
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          At least one variant is required. Each variant defines pricing and specifications.
        </p>
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <VariantRow
              key={variant.id ?? `new-${index}`}
              variant={variant}
              index={index}
              onUpdate={handleVariantUpdate}
              onRemove={removeVariant}
              canRemove={variants.length > 1}
            />
          ))}
        </div>
      </div>

      {/* Featured */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="featured"
          name="featured"
          type="checkbox"
          checked={formData.featured}
          onChange={handleChange}
        />

        <Label htmlFor="featured" className="cursor-pointer">
          Featured product (show on homepage)
        </Label>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-between">
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            Save Product
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Cancel</Link>
          </Button>
        </div>
        {isEditing && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <IconTrash className="mr-2 inline-block" />
            Delete Product
          </Button>
        )}
      </div>
    </form>
  )
}
