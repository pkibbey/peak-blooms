"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import InlineEditField from "./InlineEditField";

interface Collection {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count?: {
    products: number;
  };
}

interface AdminCollectionCardProps {
  collection: Collection;
}

export default function AdminCollectionCard({ collection }: AdminCollectionCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const productCount = collection._count?.products || 0;
    const warningMessage = productCount > 0
      ? `Are you sure you want to delete "${collection.name}"? This will also delete ${productCount} product${productCount !== 1 ? "s" : ""} in this collection. This action cannot be undone.`
      : `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`;

    if (!window.confirm(warningMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error("Failed to delete collection");
        alert("Failed to delete collection. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNameUpdate = async (newName: string | number) => {
    const response = await fetch(`/api/collections/${collection.id}`, {
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
      {/* Collection Image */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {collection.image ? (
          <Image
            src={collection.image}
            alt={collection.name}
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

      {/* Collection Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <InlineEditField
            value={collection.name}
            onSave={handleNameUpdate}
            className="font-medium"
          />
        </div>
        <p className="text-sm text-muted-foreground">/{collection.slug}</p>
        <p className="text-xs text-muted-foreground">
          {collection._count?.products || 0} product{(collection._count?.products || 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/collections/${collection.id}/edit`}>Edit</Link>
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
