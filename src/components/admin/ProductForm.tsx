"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { ImageUpload } from "@/components/admin/ImageUpload"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { COLORS } from "@/lib/colors"
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

export default function ProductForm({ collections, product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  // Track original image URL to clean up old blob when image changes
  const [originalImage] = useState(product?.image || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Normalize existing stored product colors
  const initialColors = (() => {
    const explicit = product?.colors as string[] | undefined
    if (explicit && explicit.length > 0) return explicit

    return []
  })()

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      image: product?.image || "",
      colors: initialColors,
      collectionId: product?.collectionId || "",
      featured: product?.featured || false,
      variants:
        product?.variants && product.variants.length > 0
          ? product.variants.map((v) => ({
              id: v.id,
              price: v.price.toString(),
              stemLength: v.stemLength?.toString() || "",
              countPerBunch: v.countPerBunch?.toString() || "",
              isBoxlot: v.isBoxlot || false,
            }))
          : [{ price: "", stemLength: "", countPerBunch: "", isBoxlot: false }],
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
          countPerBunch: v.countPerBunch ? Number.parseInt(v.countPerBunch) : null,
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
    append({ price: "", stemLength: "", countPerBunch: "", isBoxlot: false })
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
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => {
                      const activeValues = Array.isArray(field.value) ? field.value : []
                      const isActive = activeValues.some(
                        (v) => v?.toLowerCase() === c.hex.toLowerCase()
                      )
                      return (
                        <button
                          key={c.id}
                          type="button"
                          aria-label={c.label}
                          onClick={() => {
                            const curr = Array.isArray(field.value) ? field.value.slice() : []
                            const foundIndex = curr.findIndex(
                              (v) => v?.toLowerCase() === c.hex.toLowerCase()
                            )
                            if (foundIndex >= 0) curr.splice(foundIndex, 1)
                            else curr.push(c.hex)
                            form.setValue("colors", curr)
                          }}
                          className={`h-8 w-8 rounded-full border transition-shadow focus:outline-none ${
                            isActive ? "ring-2 ring-offset-1 ring-primary" : ""
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      )
                    })}
                    {/* Clear button */}
                    <button
                      type="button"
                      onClick={() => form.setValue("colors", [])}
                      className="h-8 px-2 rounded-md border flex items-center text-sm text-muted-foreground"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <FormControl>
                      {/* allow entering a custom hex - will add to the selection */}
                      <Input
                        placeholder="#RRGGBB (e.g. #FF6B6B)"
                        value={
                          Array.isArray(field.value) && field.value.length ? field.value[0] : ""
                        }
                        onChange={(e) => {
                          // set first / primary value as typed; don't modify others here
                          const curr = Array.isArray(field.value) ? field.value.slice() : []
                          const v = e.target.value
                          // if typed value is empty remove first
                          if (!v) {
                            curr.shift()
                            form.setValue("colors", curr)
                          } else {
                            // keep if present, else set as first
                            if (curr.length && curr[0] && curr[0] === v) {
                              // same
                            } else {
                              if (curr.length) curr[0] = v
                              else curr.unshift(v)
                              form.setValue("colors", curr)
                            }
                          }
                        }}
                      />
                    </FormControl>

                    {/* native colour picker for convenience - adds to list if not already present */}
                    <input
                      aria-label="Pick custom color"
                      type="color"
                      value={(Array.isArray(field.value) && field.value[0]) || "#000000"}
                      onChange={(e) => {
                        const val = e.target.value
                        const curr = Array.isArray(field.value) ? field.value.slice() : []
                        if (!curr.includes(val)) curr.push(val)
                        form.setValue("colors", curr)
                      }}
                      className="h-10 w-10 rounded-md border p-0"
                    />
                  </div>

                  {/* Show selected colors */}
                  <div className="flex gap-2 items-center flex-wrap">
                    {(Array.isArray(field.value) ? field.value : []).map((hex) => (
                      <div
                        key={hex}
                        className="flex items-center gap-2 px-2 py-1 border rounded-md"
                      >
                        <div
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: hex }}
                        />
                        <div className="text-sm">{hex}</div>
                        <button
                          type="button"
                          onClick={() => {
                            const curr = Array.isArray(field.value) ? field.value.slice() : []
                            const idx = curr.indexOf(hex)
                            if (idx >= 0) curr.splice(idx, 1)
                            form.setValue("colors", curr)
                          }}
                          className="text-sm text-destructive"
                        >
                          remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Collection */}
        <FormField
          control={form.control}
          name="collectionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collection *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {collections.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
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

                {/* Count Per Bunch */}
                <FormField
                  control={form.control}
                  name={`variants.${index}.countPerBunch`}
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
