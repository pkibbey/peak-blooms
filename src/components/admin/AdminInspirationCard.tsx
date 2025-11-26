"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import InlineEditField from "./InlineEditField";

interface Inspiration {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  products?: {
    id: string;
  }[];
}

interface AdminInspirationCardProps {
  inspiration: Inspiration;
}

export default function AdminInspirationCard({ inspiration }: AdminInspirationCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const productCount = inspiration.products?.length || 0;

  const handleDelete = async () => {
    const warningMessage = productCount > 0
      ? `Are you sure you want to delete "${inspiration.name}"? This inspiration has ${productCount} product${productCount !== 1 ? "s" : ""} associated. This action cannot be undone.`
      : `Are you sure you want to delete "${inspiration.name}"? This action cannot be undone.`;

    if (!window.confirm(warningMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/inspirations/${inspiration.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error("Failed to delete inspiration");
        alert("Failed to delete inspiration. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting inspiration:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNameUpdate = async (newName: string | number) => {
    const response = await fetch(`/api/inspirations/${inspiration.id}`, {
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
      {/* Inspiration Image */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {inspiration.image ? (
          <Image
            src={inspiration.image}
            alt={inspiration.name}
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

      {/* Inspiration Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <InlineEditField
            value={inspiration.name}
            onSave={handleNameUpdate}
            className="font-medium"
          />
        </div>
        <p className="text-sm text-muted-foreground">/{inspiration.slug}</p>
        <p className="text-xs text-muted-foreground">
          {productCount} product{productCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/inspirations/${inspiration.id}/edit`}>Edit</Link>
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
