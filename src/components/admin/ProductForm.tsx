"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/actions/products"
import { GenerateDescriptionButton } from "@/components/admin/GenerateDescriptionButton"
import { ImageUpload } from "@/components/admin/ImageUpload"
import { ProductImageGeneratorInline } from "@/components/admin/ProductImageGeneratorInline"
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
import { IconTrash } from "@/components/ui/icons"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ProductType } from "@/generated/enums"
import type { CollectionModel } from "@/generated/models"
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPES } from "@/lib/product-types"
import { type ProductFormData, productSchema } from "@/lib/validations/product"

interface ProductFormProps {
  collections: CollectionModel[]
  product?: {
    id: string
    name: string
    slug: string
    description: string | null
    image: string | null
    price: number
    colors?: string[] | null
    collectionIds: string[]
    productType?: ProductType
    featured: boolean
  }
}

export default function ProductForm({ collections, product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  // Track original image URL to clean up old blob when image changes
  const [originalImage] = useState(product?.image || "")
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
      productType: product?.productType || ProductType.FLOWER,
      featured: product?.featured || false,
    },
  })

  // Store original values for change detection
  const [originalValues] = useState<ProductFormData>({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    image: product?.image || "",
    price: product?.price?.toString() || "",
    colors: product?.colors || [],
    collectionIds: product?.collectionIds || [],
    productType: product?.productType || ProductType.FLOWER,
    featured: product?.featured || false,
  })

  const saveForm = async (data: ProductFormData) => {
    // saving form
    try {
      const formData = {
        ...data,
        collectionIds: data.collectionIds || [],
      }

      if (isEditing) {
        if (!product?.id) {
          form.setError("root", { message: "Product ID is missing" })
          return
        }
        const result = await updateProductAction({
          id: product.id,
          ...formData,
          colors: formData.colors || null,
          price: formData.price ? parseFloat(formData.price) : 0,
        })
        if (!result.success) {
          form.setError("root", { message: result.error })
          return
        }
        toast.success("Product updated successfully")
      } else {
        const result = await createProductAction({ ...formData, colors: formData.colors || null })
        if (!result.success) {
          form.setError("root", { message: result.error })
          return
        }
        toast.success("Product created successfully")
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred. Please try again."
      form.setError("root", { message: errorMessage })
      // error set on form state
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    await saveForm(data)
    router.push("/admin/products")
    router.refresh()
  }

  const handleBlur = async () => {
    // Validate and save on blur (only if it's in editing mode to avoid redirects)
    // Check if the current values differ from the original values
    if (isEditing) {
      const currentData = form.getValues()
      const hasChanged = JSON.stringify(currentData) !== JSON.stringify(originalValues)

      if (hasChanged) {
        const isValid = await form.trigger()
        if (isValid) {
          await saveForm(currentData)
        }
      }
    }
  }

  const handleDelete = async () => {
    if (!product) return

    if (
      !window.confirm(
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteProductAction({ id: product.id })
      toast.success("Product deleted successfully")
      router.push("/admin/products")
      router.refresh()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete product. Please try again."
      form.setError("root", { message: errorMessage })
      // error saved to form
    } finally {
      setIsDeleting(false)
    }
  }

  // Watch the slug for ImageUpload
  const watchedSlug = form.watch("slug")

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          // form submit
          form.handleSubmit(onSubmit)(e)
        }}
        className="space-y-6"
      >
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
                    placeholder="Product name"
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

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Description</FormLabel>
                <GenerateDescriptionButton
                  productName={form.watch("name")}
                  productType={form.watch("productType") || ProductType.FLOWER}
                  existingDescription={form.watch("description")}
                  onDescriptionGenerated={(description) => {
                    form.setValue("description", description)
                    handleBlur()
                  }}
                />
              </div>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  placeholder="Product description..."
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

        <div className="flex gap-6 md:grid-cols-3 items-start">
          {/* Image */}
          <div className="flex-1 flex flex-col gap-2">
            <ImageUpload
              value={form.watch("image")}
              onChange={(url) => {
                form.setValue("image", url)
                handleBlur()
              }}
              folder="products"
              slug={watchedSlug}
              previousUrl={originalImage}
              label="Image"
            />
            {form.formState.errors.image && (
              <div className="text-sm text-destructive">{form.formState.errors.image.message}</div>
            )}
          </div>

          {/* Generate Product Image */}
          <ProductImageGeneratorInline
            productName={form.watch("name") || product?.name || "Product"}
            productType={form.watch("productType") || ProductType.FLOWER}
            productDescription={form.watch("description")}
            onImageSaved={(imageUrl) => {
              form.setValue("image", imageUrl)
              handleBlur()
            }}
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
                    onChange={(colors) => {
                      form.setValue("colors", colors)
                      handleBlur()
                    }}
                    showLabel={false}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Product Type */}
        <FormField
          control={form.control}
          name="productType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Type *</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  handleBlur()
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a product type" />
                  </SelectTrigger>
                </FormControl>
                <SelectPositioner alignItemWithTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {PRODUCT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
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
              <FormLabel>Price (per unit)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
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

        {/* Featured */}
        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(value) => {
                    field.onChange(value)
                    handleBlur()
                  }}
                />
              </FormControl>
              <FormLabel className="cursor-pointer font-normal">
                Featured product (show on homepage)
              </FormLabel>
            </FormItem>
          )}
        />

        {/* Collections */}
        <FormField
          control={form.control}
          name="collectionIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collections *</FormLabel>
              <FormControl>
                <ToggleGroup
                  variant="outline"
                  multiple
                  value={field.value ?? []}
                  onValueChange={(value) => {
                    field.onChange(value)
                    handleBlur()
                  }}
                  className="flex flex-wrap sm:flex-row w-auto"
                >
                  {collections.map((col) => (
                    <ToggleGroupItem
                      key={col.id}
                      value={col.id}
                      aria-label={col.name}
                      className="px-4 font-semibold"
                    >
                      {col.name}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        {isEditing && (
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <IconTrash className="inline-block" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
