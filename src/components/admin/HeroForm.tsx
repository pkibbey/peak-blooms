"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ImageUpload } from "@/components/admin/ImageUpload"
import SlugInput from "@/components/admin/SlugInput"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { IconTrash } from "@/components/ui/icons"
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
import {
  GRADIENT_PRESETS,
  type HeroFormData,
  heroSchema,
  VALID_CTA_ROUTES,
} from "@/lib/validations/hero"

interface HeroFormProps {
  hero?: {
    id: string
    name: string
    slug: string
    title: string
    subtitle: string
    ctaText: string | null
    ctaLink: string | null
    backgroundType: "IMAGE" | "GRADIENT"
    backgroundImage: string | null
    gradientPreset: string | null
    slotPosition: number | null
    textPosition?: string | null
  }
}

export default function HeroForm({ hero }: HeroFormProps) {
  const router = useRouter()
  const isEditing = !!hero

  // Track original image URL to clean up old blob when image changes
  const [originalImage] = useState(hero?.backgroundImage || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<HeroFormData>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      name: hero?.name || "",
      slug: hero?.slug || "",
      title: hero?.title || "",
      subtitle: hero?.subtitle || "",
      ctaText: hero?.ctaText || "",
      ctaLink: hero?.ctaLink || "",
      backgroundType: hero?.backgroundType || "GRADIENT",
      backgroundImage: hero?.backgroundImage || "",
      gradientPreset: hero?.gradientPreset || "slate-green",
      slotPosition: hero?.slotPosition ?? null,
      textPosition: (hero?.textPosition as "left" | "center" | "right") ?? "left",
    },
  })

  const backgroundType = form.watch("backgroundType")

  const onSubmit = async (data: HeroFormData) => {
    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/heroes/${hero.id}` : "/api/heroes"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        // ensure cookies (next-auth session) are sent for server-side auth checks
        credentials: "same-origin",
      })

      if (response.ok) {
        toast.success(isEditing ? "Hero updated successfully" : "Hero created successfully")
        router.push("/admin/heroes")
        router.refresh()
      } else {
        const responseData = await response.json()
        form.setError("root", { message: responseData.error || "Failed to save hero" })
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
        `Are you sure you want to delete "${hero?.name}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/heroes/${hero?.id}`, {
        method: "DELETE",
        // ensure cookies (next-auth session) are sent for server-side auth checks
        credentials: "same-origin",
      })

      if (response.ok) {
        toast.success("Hero deleted successfully")
        router.push("/admin/heroes")
        router.refresh()
      } else {
        form.setError("root", { message: "Failed to delete hero. Please try again." })
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

        {/* Basic Info */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Admin-friendly name" />
                </FormControl>
                <FormDescription>Internal name for identification</FormDescription>
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

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Hero headline" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Text Position */}
        <FormField
          control={form.control}
          name="textPosition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Text Position</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? "left"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Choose how text is aligned within the hero banner</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Subtitle */}
        <FormField
          control={form.control}
          name="subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtitle *</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="Supporting text..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CTA Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* CTA Text */}
          <FormField
            control={form.control}
            name="ctaText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CTA Button Text</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Shop Now" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CTA Link */}
          <FormField
            control={form.control}
            name="ctaLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CTA Link</FormLabel>
                {/* Allow either selecting a known internal route or entering a custom path (e.g. with query params) */}
                <Select
                  onValueChange={(val) => {
                    if (val === "none") return field.onChange("")
                    if (val === "custom") return field.onChange("")
                    return field.onChange(val)
                  }}
                  value={
                    VALID_CTA_ROUTES.includes(field.value as (typeof VALID_CTA_ROUTES)[number])
                      ? (field.value as string)
                      : field.value
                        ? "custom"
                        : "none"
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a page" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {VALID_CTA_ROUTES.map((route) => (
                      <SelectItem key={route} value={route}>
                        {route}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {/* If the current value is custom (not empty and not a known route), show a free text input */}
                {(field.value &&
                  !VALID_CTA_ROUTES.includes(field.value as (typeof VALID_CTA_ROUTES)[number])) ||
                (field.value === "" && field.value !== undefined && field.value !== null) ? (
                  <div className="mt-2">
                    <Input
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="e.g. /shop?utm_campaign=fall"
                    />
                  </div>
                ) : (
                  // also allow entering query params explicitly when choose 'custom'
                  <div className="mt-2">
                    <Input
                      value={
                        field.value &&
                        !VALID_CTA_ROUTES.includes(field.value as (typeof VALID_CTA_ROUTES)[number])
                          ? field.value
                          : ""
                      }
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="Optional: add query params, e.g. /shop?utm_campaign=fall"
                    />
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Background Type */}
        <FormField
          control={form.control}
          name="backgroundType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="GRADIENT">Gradient</SelectItem>
                  <SelectItem value="IMAGE">Image</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gradient Preset Selector */}
        {backgroundType === "GRADIENT" && (
          <FormField
            control={form.control}
            name="gradientPreset"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gradient Preset *</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => field.onChange(preset.value)}
                      className={`group relative rounded-lg border-2 p-1 transition-all ${
                        field.value === preset.value
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div
                        className="h-16 rounded-md"
                        style={{
                          background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`,
                        }}
                      />
                      <Label className="mt-1 block text-center text-xs">{preset.label}</Label>
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Image Upload */}
        {backgroundType === "IMAGE" && (
          <ImageUpload
            value={form.watch("backgroundImage") || ""}
            onChange={(url) => form.setValue("backgroundImage", url)}
            folder="heroes"
            slug={watchedSlug}
            previousUrl={originalImage}
            label="Background Image *"
            required
            aspectRatio="4:1"
          />
        )}

        {/* Slot Position */}
        <FormField
          control={form.control}
          name="slotPosition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Homepage Slot</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))}
                value={field.value?.toString() || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Not displayed</SelectItem>
                  <SelectItem value="1">Slot 1 (Above Featured Collections)</SelectItem>
                  <SelectItem value="2">Slot 2 (Between Sections)</SelectItem>
                  <SelectItem value="3">Slot 3 (Below Featured Products)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Multiple banners can be assigned to the same slot (they will stack vertically)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-4 justify-between">
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Hero"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/heroes">Cancel</Link>
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
              {isDeleting ? "Deleting..." : "Delete Hero"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
