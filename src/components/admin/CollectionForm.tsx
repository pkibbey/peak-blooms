"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ImageUpload } from "@/components/admin/ImageUpload"
import ProductMultiSelectSimple from "@/components/admin/ProductMultiSelectSimple"
import SlugInput from "@/components/admin/SlugInput"
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
import { Textarea } from "@/components/ui/textarea"
import { type CollectionFormData, collectionSchema } from "@/lib/validations/collection"
import { IconTrash } from "../ui/icons"

interface ProductVariant {
  id: string
  price: number
  stemLength: number | null
  quantityPerBunch: number | null
}

interface Product {
  id: string
  name: string
  collection?: {
    name: string
  }
  variants?: ProductVariant[]
}

interface CollectionFormProps {
  collection?: {
    id: string
    name: string
    slug: string
    image: string | null
    description: string | null
    featured: boolean
    _count?: {
      productCollections: number
    }
    productCollections?: Array<{
      productId: string
    }>
  }
  products?: Product[]
}

export default function CollectionForm({ collection, products = [] }: CollectionFormProps) {
  const router = useRouter()
  const isEditing = !!collection

  // Track original image URL to clean up old blob when image changes
  const [originalImage] = useState(collection?.image || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Product selection state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    collection?.productCollections?.map((pc) => pc.productId) || []
  )

  const form = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name || "",
      slug: collection?.slug || "",
      image: collection?.image || "",
      description: collection?.description || "",
      featured: collection?.featured || false,
    },
  })

  const onSubmit = async (data: CollectionFormData) => {
    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/collections/${collection.id}` : "/api/collections"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          productIds: selectedProductIds,
        }),
      })

      if (response.ok) {
        toast.success(
          isEditing ? "Collection updated successfully" : "Collection created successfully"
        )
        router.push("/admin/collections")
        router.refresh()
      } else {
        const responseData = await response.json()
        form.setError("root", { message: responseData.error || "Failed to save collection" })
      }
    } catch (err) {
      form.setError("root", { message: "An error occurred. Please try again." })
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const productCount = collection?._count?.productCollections || 0
    const warningMessage =
      productCount > 0
        ? `Are you sure you want to delete "${collection?.name}"? This will remove the collection association from ${productCount} product${
            productCount !== 1 ? "s" : ""
          } — products will remain but won't be assigned to this collection. This action cannot be undone.`
        : `Are you sure you want to delete "${collection?.name}"? This action cannot be undone.`

    if (!window.confirm(warningMessage)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/collections/${collection?.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Collection deleted successfully")
        router.push("/admin/collections")
        router.refresh()
      } else {
        form.setError("root", { message: "Failed to delete collection. Please try again." })
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
                  <Input {...field} placeholder="Collection name" />
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
                <Textarea {...field} rows={4} placeholder="Collection description..." />
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange((e.target as HTMLInputElement).checked)}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Featured collection (show on homepage)</FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image */}
        <ImageUpload
          value={form.watch("image")}
          onChange={(url) => form.setValue("image", url)}
          folder="collections"
          slug={watchedSlug}
          previousUrl={originalImage}
          label="Image"
        />

        {/* Products */}
        {products.length > 0 && (
          <div className="space-y-2">
            <FormLabel>Products in Collection</FormLabel>
            <p className="text-xs text-muted-foreground mb-2">
              Select products to add to this collection
            </p>
            <ProductMultiSelectSimple
              products={products}
              selectedIds={selectedProductIds}
              onChange={setSelectedProductIds}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-between">
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Collection"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link prefetch={false} href="/admin/collections">
                Cancel
              </Link>
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
              {isDeleting ? "Deleting..." : "Delete Collection"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
