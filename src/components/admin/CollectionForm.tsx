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
import { IconTrash } from "../ui/icons";

interface CollectionFormProps {
  collection?: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    description: string | null;
    _count?: {
      products: number;
    };
  };
}

export default function CollectionForm({ collection }: CollectionFormProps) {
  const router = useRouter();
  const isEditing = !!collection;

  const [formData, setFormData] = useState({
    name: collection?.name || "",
    slug: collection?.slug || "",
    image: collection?.image || "",
    description: collection?.description || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing ? `/api/collections/${collection.id}` : "/api/collections";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(isEditing ? "Collection updated successfully" : "Collection created successfully");
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

  const handleDelete = async () => {
    const productCount = collection?._count?.products || 0;
    const warningMessage = productCount > 0
      ? `Are you sure you want to delete "${collection?.name}"? This will also delete ${productCount} product${productCount !== 1 ? "s" : ""} in this collection. This action cannot be undone.`
      : `Are you sure you want to delete "${collection?.name}"? This action cannot be undone.`;

    if (!window.confirm(warningMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collection?.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Collection deleted successfully");
        router.push("/admin/collections");
        router.refresh();
      } else {
        setError("Failed to delete collection. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsDeleting(false);
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
      <div className="flex gap-4 justify-between">
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            Save Collection
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/collections">Cancel</Link>
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
            Delete Collection
          </Button>
        )}
      </div>
    </form>
  );
}
