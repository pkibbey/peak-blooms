"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { ImageUpload } from "@/components/admin/ImageUpload"
import SlugInput from "@/components/admin/SlugInput"
import { ColorSelector } from "@/components/site/ColorSelector"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { type ProductFormData, productSchema } from "@/lib/validations/product"
import { IconPlus, IconTrash } from "../ui/icons"

interface Collection {
  id: string
  name: string
}

interface ProductFormProps {
  collections: Collection[]
  product?: {
    id: string
    name: string
    slug: string
    description: string | null
    image: string | null
    colors?: string[] | null
    collectionIds: string[]
    productType?: "FLOWER" | "FILLER" | "ROSE"
    featured: boolean
    variants?: {
      id: string
      price: number
      stemLength: number | null
      quantityPerBunch: number | null
      isBoxlot: boolean
    }[]
  }
}

export default function ProductForm({ collections, product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  // Track original image URL to clean up old blob when image changes
  const [originalImage] = useState(product?.image || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Color IDs are stored directly in the database
  const initialColors = product?.colors || []

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      image: product?.image || "",
      colors: initialColors,
      collectionIds: product?.collectionIds || [],
      productType: product?.productType || "FLOWER",
      featured: product?.featured || false,
      variants:
        product?.variants && product.variants.length > 0
          ? product.variants.map((v) => ({
              id: v.id,
              price: v.price.toString(),
              stemLength: v.stemLength?.toString() || "",
              quantityPerBunch: v.quantityPerBunch?.toString() || "",
              isBoxlot: v.isBoxlot || false,
            }))
          : [{ price: "", stemLength: "", quantityPerBunch: "", isBoxlot: false }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  })

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/products/${product.id}` : "/api/products"
      const method = isEditing ? "PUT" : "POST"

      // Filter out empty variants and transform to API format
      const validVariants = data.variants
        .filter((v) => v.price.trim() !== "")
        .map((v) => ({
          price: Number.parseFloat(v.price),
          stemLength: v.stemLength ? Number.parseInt(v.stemLength) : null,
          quantityPerBunch: v.quantityPerBunch ? Number.parseInt(v.quantityPerBunch) : null,
          isBoxlot: v.isBoxlot,
        }))

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          variants: validVariants,
        }),
      })

      if (response.ok) {
        toast.success(isEditing ? "Product updated successfully" : "Product created successfully")
        router.push("/admin/products")
        router.refresh()
      } else {
        const responseData = await response.json()
        form.setError("root", { message: responseData.error || "Failed to save product" })
      }
    } catch (err) {
      form.setError("root", { message: "An error occurred. Please try again." })
      console.error(err)
    } finally {
      setIsSubmitting(false)
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
        form.setError("root", { message: "Failed to delete product. Please try again." })
      }
    } catch (err) {
      form.setError("root", { message: "An error occurred. Please try again." })
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const addVariant = () => {
    append({ price: "", stemLength: "", quantityPerBunch: "", isBoxlot: false })
  }

  // Watch the slug for ImageUpload
  const watchedSlug = form.watch("slug")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {form.formState.errors.root && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Product name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Slug */}
          <SlugInput
            name={form.watch("name")}
            slug={form.watch("slug")}
            onSlugChange={(slug) => form.setValue("slug", slug)}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} placeholder="Product description..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-6 md:grid-cols-auto_1">
          {/* Image */}
          <ImageUpload
            value={form.watch("image")}
            onChange={(url) => form.setValue("image", url)}
            folder="products"
            slug={watchedSlug}
            previousUrl={originalImage}
            label="Image"
          />

          {/* Color */}
          <FormField
            control={form.control}
            name="colors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <div className="flex flex-col gap-4">
                  {/* Color Swatches */}
                  <ColorSelector
                    selectedColors={Array.isArray(field.value) ? field.value : []}
                    onChange={(colors) => form.setValue("colors", colors)}
                    showLabel={false}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Collections */}
        <FormField
          control={form.control}
          name="collectionIds"
          render={() => (
            <FormItem>
              <FormLabel>Collections *</FormLabel>
              <div className="space-y-2">
                {collections.map((col) => (
                  <FormField
                    key={col.id}
                    control={form.control}
                    name="collectionIds"
                    render={({ field }) => {
                      const isChecked = (field.value ?? []).includes(col.id)
                      return (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => {
                                const checked = (e.target as HTMLInputElement).checked
                                const newValue = checked
                                  ? [...(field.value || []), col.id]
                                  : (field.value || []).filter((id) => id !== col.id)
                                field.onChange(newValue)
                              }}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer font-normal">{col.name}</FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Type */}
        <FormField
          control={form.control}
          name="productType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a product type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FLOWER">Flower</SelectItem>
                  <SelectItem value="ROSE">Rose</SelectItem>
                  <SelectItem value="FILLER">Filler</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Variants Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Variants *</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <IconPlus className="h-4 w-4 mr-1" />
              Add Variant
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            At least one variant is required. Each variant defines pricing and specifications.
          </p>

          {/* Show array-level errors */}
          {form.formState.errors.variants?.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.variants.root.message}
            </p>
          )}
          {form.formState.errors.variants?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.variants.message}</p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-4 md:grid-cols-5 items-end p-4 border border-border rounded-md bg-muted/30"
              >
                {/* Price */}
                <FormField
                  control={form.control}
                  name={`variants.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Stem Length */}
                <FormField
                  control={form.control}
                  name={`variants.${index}.stemLength`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stem Length (cm)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" placeholder="e.g., 50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quantity Per Bunch */}
                <FormField
                  control={form.control}
                  name={`variants.${index}.quantityPerBunch`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stems Per Bunch</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" placeholder="e.g., 10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Boxlot Checkbox */}
                <FormField
                  control={form.control}
                  name={`variants.${index}.isBoxlot`}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 h-10 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer text-sm font-normal">
                        Boxlot (Bulk)
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Remove Button */}
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white disabled:opacity-50"
                  >
                    <IconTrash className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured */}
        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </FormControl>
              <FormLabel className="cursor-pointer font-normal">
                Featured product (show on homepage)
              </FormLabel>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-4 justify-between">
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Product"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/products">Cancel</Link>
            </Button>
          </div>
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <IconTrash className="mr-2 inline-block" />
              {isDeleting ? "Deleting..." : "Delete Product"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
