"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  createInspirationAction,
  deleteInspirationAction,
  updateInspirationAction,
} from "@/app/actions/inspirations"
import { ImageUpload } from "@/components/admin/ImageUpload"
import ProductMultiSelect from "@/components/admin/ProductMultiSelect"
import SlugInput from "@/components/admin/SlugInput"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { IconTrash } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ProductModel } from "@/generated/models"
import {
  createInspirationSchema,
  type InspirationFormData,
  type ProductSelection,
} from "@/lib/validations/inspiration"

interface InspirationFormProps {
  products: ProductModel[]
  inspiration?: {
    id: string
    name: string
    slug: string
    subtitle: string
    image: string
    excerpt: string
    text: string
    products: Array<{
      productId: string
      quantity: number
    }>
  }
}

export default function InspirationForm({ products, inspiration }: InspirationFormProps) {
  const router = useRouter()
  const isEditing = !!inspiration
  const [isPending, startTransition] = useTransition()

  // Track original image URL to clean up old blob when image changes
  const [originalImage] = useState(inspiration?.image || "")
  const [isDeleting, setIsDeleting] = useState(false)

  // Product selection state (managed outside react-hook-form for ProductMultiSelect compatibility)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    inspiration?.products?.map((p) => p.productId) || []
  )
  const [productSelections, setProductSelections] = useState<ProductSelection[]>(
    inspiration?.products?.map((p) => ({
      productId: p.productId,
      quantity: p.quantity ?? 1,
    })) || []
  )

  const form = useForm<InspirationFormData>({
    resolver: zodResolver(createInspirationSchema),
    defaultValues: {
      name: inspiration?.name || "",
      slug: inspiration?.slug || "",
      subtitle: inspiration?.subtitle || "",
      image: inspiration?.image || "",
      excerpt: inspiration?.excerpt || "",
      text: inspiration?.text || "",
      productSelections: productSelections,
    },
  })

  // Store original values for change detection
  const [originalValues] = useState<InspirationFormData>({
    name: inspiration?.name || "",
    slug: inspiration?.slug || "",
    subtitle: inspiration?.subtitle || "",
    image: inspiration?.image || "",
    excerpt: inspiration?.excerpt || "",
    text: inspiration?.text || "",
    productSelections: productSelections,
  })

  const saveForm = async (data: InspirationFormData) => {
    try {
      if (isEditing) {
        await updateInspirationAction({
          id: inspiration.id,
          ...data,
          productSelections: productSelections,
        })
        toast.success("Inspiration updated successfully")
      } else {
        await createInspirationAction({
          ...data,
          productSelections: productSelections,
        })
        toast.success("Inspiration created successfully")
        router.push("/admin/inspirations")
        router.refresh()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save inspiration"
      form.setError("root", { message })
    }
  }

  const onSubmit = async (data: InspirationFormData) => {
    startTransition(async () => {
      await saveForm(data)
    })
  }

  const handleBlur = async () => {
    if (isEditing) {
      const currentData = form.getValues()
      const hasChanged = JSON.stringify(currentData) !== JSON.stringify(originalValues)

      if (hasChanged) {
        const isValid = await form.trigger()
        if (isValid) {
          const data = form.getValues()
          startTransition(async () => {
            await saveForm(data)
          })
        }
      }
    }
  }

  const handleDelete = async () => {
    if (!inspiration) return

    const productCount = inspiration.products?.length || 0
    const warningMessage =
      productCount > 0
        ? `Are you sure you want to delete "${inspiration.name}"? This inspiration has ${productCount} product${productCount !== 1 ? "s" : ""} associated. This action cannot be undone.`
        : `Are you sure you want to delete "${inspiration.name}"? This action cannot be undone.`

    if (!window.confirm(warningMessage)) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteInspirationAction({ id: inspiration.id })
      toast.success("Inspiration deleted successfully")
      router.push("/admin/inspirations")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete inspiration"
      form.setError("root", { message })
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
                  <Input
                    {...field}
                    placeholder="Inspiration name"
                    onBlur={() => {
                      field.onBlur()
                      handleBlur()
                    }}
                  />
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

        {/* Subtitle */}
        <FormField
          control={form.control}
          name="subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtitle *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="A short, catchy subtitle"
                  onBlur={() => {
                    field.onBlur()
                    handleBlur()
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image */}
        <ImageUpload
          value={form.watch("image")}
          onChange={(url) => {
            form.setValue("image", url)
            handleBlur()
          }}
          folder="inspiration"
          slug={watchedSlug}
          previousUrl={originalImage}
          label="Image"
          aspectRatio="16:9"
          required
        />
        {form.formState.errors.image && (
          <p className="text-sm text-destructive">{form.formState.errors.image.message}</p>
        )}

        {/* Excerpt */}
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Excerpt *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={3}
                  placeholder="A brief description for previews and cards..."
                  onBlur={() => {
                    field.onBlur()
                    handleBlur()
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Inspiration Text */}
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Inspiration Text *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={6}
                  placeholder="The full story or description for the inspiration page..."
                  onBlur={() => {
                    field.onBlur()
                    handleBlur()
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Products */}
        <div className="space-y-2">
          <FormLabel>Products in Inspiration</FormLabel>
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
        <div className="flex gap-4 justify-end">
          {isEditing && (
            <Button
              type="button"
              variant="outline-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <IconTrash className="mr-2 inline-block" />
              {isDeleting ? "Deleting..." : "Delete Inspiration"}
            </Button>
          )}
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Inspiration"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
