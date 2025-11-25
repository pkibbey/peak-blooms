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
import ProductMultiSelect from "@/components/admin/ProductMultiSelect";

interface ProductVariant {
  id: string;
  price: number;
  stemLength: number | null;
  countPerBunch: number | null;
}

interface Product {
  id: string;
  name: string;
  category?: {
    name: string;
  };
  variants?: ProductVariant[];
}

interface ProductSelection {
  productId: string;
  productVariantId: string | null;
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
    products: Array<{ 
      productId: string; 
      productVariantId: string | null;
    }>;
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
    collection?.products?.map((p) => p.productId) || []
  );

  const [productSelections, setProductSelections] = useState<ProductSelection[]>(
    collection?.products?.map((p) => ({
      productId: p.productId,
      productVariantId: p.productVariantId,
    })) || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing ? `/api/inspirations/${collection.id}` : "/api/inspirations";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          productSelections: productSelections,
        }),
      });

      if (response.ok) {
        toast.success(isEditing ? "Inspiration updated successfully" : "Inspiration created successfully");
        router.push("/admin/inspirations");
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save inspiration");
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
            placeholder="Inspiration name"
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
        <Input
          id="subtitle"
          name="subtitle"
          type="text"
          required
          value={formData.subtitle}
          onChange={handleChange}
          placeholder="A short, catchy subtitle"
        />
      </div>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image">Image URL *</Label>
        <Input
          id="image"
          name="image"
          required
          value={formData.image}
          onChange={handleChange}
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
        <Textarea
          id="excerpt"
          name="excerpt"
          required
          value={formData.excerpt}
          onChange={handleChange}
          rows={3}
          placeholder="A brief description for previews and cards..."
        />
      </div>

      {/* Inspiration Text */}
      <div className="space-y-2">
        <Label htmlFor="inspirationText">Full Inspiration Text *</Label>
        <Textarea
          id="inspirationText"
          name="inspirationText"
          required
          value={formData.inspirationText}
          onChange={handleChange}
          rows={6}
          placeholder="The full story or description for the inspiration page..."
        />
      </div>

      {/* Products */}
      <div className="space-y-2">
        <Label>Products in Inspiration</Label>
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
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isEditing ? "Update Inspiration" : "Create Inspiration"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/inspirations">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
