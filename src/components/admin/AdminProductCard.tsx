"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  slug: string;
  featured: boolean;
  image: string | null;
  category: {
    id: string;
    name: string;
  };
  variants: {
    id: string;
    price: number;
  }[];
}

interface AdminProductCardProps {
  product: Product;
}

export default function AdminProductCard({ product }: AdminProductCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFeatured, setIsFeatured] = useState(product.featured);
  const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error("Failed to delete product");
        alert("Failed to delete product. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFeatured = async () => {
    setIsTogglingFeatured(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !isFeatured }),
      });

      if (response.ok) {
        setIsFeatured(!isFeatured);
        router.refresh();
      } else {
        console.error("Failed to update featured status");
      }
    } catch (error) {
      console.error("Error updating featured status:", error);
    } finally {
      setIsTogglingFeatured(false);
    }
  };

  // Calculate price range from variants
  const prices = product.variants.map((v) => v.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const priceDisplay =
    minPrice === maxPrice
      ? `$${minPrice.toFixed(2)}`
      : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-4">
      {/* Product Image */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{product.name}</h3>
          {isFeatured && (
            <Badge variant="secondary" className="shrink-0">
              Featured
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{product.category.name}</p>
        <div className="mt-1 flex items-center gap-4">
          <span className="text-sm font-medium">{priceDisplay}</span>
          <span className="text-xs text-muted-foreground">
            ({product.variants.length} variant{product.variants.length !== 1 ? "s" : ""})
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isFeatured ? "outline" : "secondary"}
          onClick={handleToggleFeatured}
          disabled={isTogglingFeatured}
        >
          {isTogglingFeatured ? "..." : isFeatured ? "Unfeature" : "Feature"}
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}
