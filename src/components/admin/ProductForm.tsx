"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
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
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { type ProductFormData, productSchema } from "@/lib/validations/product"
import { IconTrash } from "../ui/icons"

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
    price: number | null
    colors?: string[] | null
    collectionIds: string[]
    productType?: "FLOWER" | "FILLER" | "ROSE"
    featured: boolean
  }
}

export default function ProductForm({ collections, product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  // Track original image URL to clean up old blob when image changes
  const [originalImage] = useState(product?.image || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      image: product?.image || "",
      price: product?.price?.toString() || "",
      colors: product?.colors || [],
      collectionIds: product?.collectionIds || [],
      productType: product?.productType || "FLOWER",
      featured: product?.featured || false,
    },
  })

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/products/${product.id}` : "/api/products"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          price: Number.parseFloat(data.price),
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
                              onCheckedChange={(value) => {
                                const newValue = value
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
                <SelectPositioner alignItemWithTrigger>
                  <SelectContent>
                    <SelectItem value="FLOWER">Flower</SelectItem>
                    <SelectItem value="ROSE">Rose</SelectItem>
                    <SelectItem value="FILLER">Filler</SelectItem>
                  </SelectContent>
                </SelectPositioner>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price */}
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (per unit) *</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Featured */}
        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
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
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link prefetch={false} href="/admin/products">
                  Cancel
                </Link>
              }
            />
          </div>
          {isEditing && (
            <Button
              type="button"
              variant="outline-destructive"
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
