"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import InlineEditField from "./InlineEditField";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count?: {
    products: number;
  };
}

interface AdminCategoryCardProps {
  category: Category;
}

export default function AdminCategoryCard({ category }: AdminCategoryCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const productCount = category._count?.products || 0;
    const warningMessage = productCount > 0
      ? `Are you sure you want to delete "${category.name}"? This will also delete ${productCount} product${productCount !== 1 ? "s" : ""} in this category. This action cannot be undone.`
      : `Are you sure you want to delete "${category.name}"? This action cannot be undone.`;

    if (!window.confirm(warningMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error("Failed to delete category");
        alert("Failed to delete category. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNameUpdate = async (newName: string | number) => {
    const response = await fetch(`/api/categories/${category.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) {
      throw new Error("Failed to update name");
    }

    router.refresh();
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-4">
      {/* Category Image */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
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

      {/* Category Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <InlineEditField
            value={category.name}
            onSave={handleNameUpdate}
            className="font-medium"
          />
        </div>
        <p className="text-sm text-muted-foreground">/{category.slug}</p>
        <p className="text-xs text-muted-foreground">
          {category._count?.products || 0} product{(category._count?.products || 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/categories/${category.id}/edit`}>Edit</Link>
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
