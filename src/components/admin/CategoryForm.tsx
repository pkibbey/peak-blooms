"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SlugInput from "@/components/admin/SlugInput";

interface CategoryFormProps {
  category?: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    description: string | null;
  };
}

export default function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const isEditing = !!category;

  const [formData, setFormData] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    image: category?.image || "",
    description: category?.description || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing ? `/api/collections/${category.id}` : "/api/collections";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(isEditing ? "Category updated successfully" : "Category created successfully");
        router.push("/admin/collections");
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save collection");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
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
            placeholder="Collection name"
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
          placeholder="Collection description..."
        />
      </div>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          name="image"
          value={formData.image}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
        />
        {formData.image && (
          <div className="relative mt-2 h-32 w-32">
            <Image
              src={formData.image}
              alt="Preview"
              fill
              className="rounded-md object-cover"
              sizes="128px"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          Save Collection
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/collections">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
