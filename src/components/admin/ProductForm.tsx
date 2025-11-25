"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SlugInput from "@/components/admin/SlugInput";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    price: number;
    color: string | null;
    stemLength: number | null;
    countPerBunch: number | null;
    categoryId: string;
    featured: boolean;
  };
}

export default function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    image: product?.image || "",
    price: product?.price?.toString() || "",
    color: product?.color || "",
    stemLength: product?.stemLength?.toString() || "",
    countPerBunch: product?.countPerBunch?.toString() || "",
    categoryId: product?.categoryId || "",
    featured: product?.featured || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing ? `/api/products/${product.id}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stemLength: formData.stemLength ? parseInt(formData.stemLength) : null,
          countPerBunch: formData.countPerBunch ? parseInt(formData.countPerBunch) : null,
        }),
      });

      if (response.ok) {
        router.push("/admin/products");
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save product");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
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
            placeholder="Product name"
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
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Product description..."
        />
      </div>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <input
          id="image"
          name="image"
          type="url"
          value={formData.image}
          onChange={handleChange}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <input
            id="price"
            name="price"
            type="number"
            required
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="0.00"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category *</Label>
          <select
            id="categoryId"
            name="categoryId"
            required
            value={formData.categoryId}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Color */}
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <input
            id="color"
            name="color"
            type="text"
            value={formData.color}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="e.g., Red, Pink, White"
          />
        </div>

        {/* Stem Length */}
        <div className="space-y-2">
          <Label htmlFor="stemLength">Stem Length (cm)</Label>
          <input
            id="stemLength"
            name="stemLength"
            type="number"
            min="0"
            value={formData.stemLength}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="e.g., 50"
          />
        </div>

        {/* Count Per Bunch */}
        <div className="space-y-2">
          <Label htmlFor="countPerBunch">Stems Per Bunch</Label>
          <input
            id="countPerBunch"
            name="countPerBunch"
            type="number"
            min="0"
            value={formData.countPerBunch}
            onChange={handleChange}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="e.g., 10"
          />
        </div>
      </div>

      {/* Featured */}
      <div className="flex items-center gap-2">
        <input
          id="featured"
          name="featured"
          type="checkbox"
          checked={formData.featured}
          onChange={handleChange}
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="featured" className="cursor-pointer">
          Featured product (show on homepage)
        </Label>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
