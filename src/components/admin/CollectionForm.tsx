"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SlugInput from "@/components/admin/SlugInput";
import ProductMultiSelect from "@/components/admin/ProductMultiSelect";

interface Product {
  id: string;
  name: string;
  category?: {
    name: string;
  };
}

interface CollectionFormProps {
  products: Product[];
  collection?: {
    id: string;
    name: string;
    slug: string;
    subtitle: string;
    image: string;
    excerpt: string;
    inspirationText: string;
    products: Array<{ id: string }>;
  };
}

export default function CollectionForm({ products, collection }: CollectionFormProps) {
  const router = useRouter();
  const isEditing = !!collection;

  const [formData, setFormData] = useState({
    name: collection?.name || "",
    slug: collection?.slug || "",
    subtitle: collection?.subtitle || "",
    image: collection?.image || "",
    excerpt: collection?.excerpt || "",
    inspirationText: collection?.inspirationText || "",
  });

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    collection?.products?.map((p) => p.id) || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing ? `/api/inspiration/${collection.id}` : "/api/inspiration";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          productIds: selectedProductIds,
        }),
      });

      if (response.ok) {
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
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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

      {/* Subtitle */}
      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle *</Label>
        <input
          id="subtitle"
          name="subtitle"
          type="text"
          required
          value={formData.subtitle}
          onChange={handleChange}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="A short, catchy subtitle"
        />
      </div>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image">Image URL *</Label>
        <input
          id="image"
          name="image"
          type="url"
          required
          value={formData.image}
          onChange={handleChange}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="https://example.com/image.jpg"
        />
        {formData.image && (
          <div className="relative mt-2 h-48 w-full max-w-md">
            <Image
              src={formData.image}
              alt="Preview"
              fill
              className="rounded-md object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">Short Excerpt *</Label>
        <textarea
          id="excerpt"
          name="excerpt"
          required
          value={formData.excerpt}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="A brief description for previews and cards..."
        />
      </div>

      {/* Inspiration Text */}
      <div className="space-y-2">
        <Label htmlFor="inspirationText">Full Inspiration Text *</Label>
        <textarea
          id="inspirationText"
          name="inspirationText"
          required
          value={formData.inspirationText}
          onChange={handleChange}
          rows={6}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="The full story or description for the collection page..."
        />
      </div>

      {/* Products */}
      <div className="space-y-2">
        <Label>Products in Collection</Label>
        <ProductMultiSelect
          products={products}
          selectedIds={selectedProductIds}
          onChange={setSelectedProductIds}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Collection" : "Create Collection"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/collections">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
