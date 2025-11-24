"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface AddAllToCartButtonProps {
  productIds: string[];
  productVariantIds?: (string | null)[];
  setName?: string;
  user?: { approved: boolean } | null;
}

export default function AddAllToCartButton({ productIds, productVariantIds, setName, user }: AddAllToCartButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAllToCart = async () => {
    if (!session && !user) {
      // If session isn't available client-side and server didn't pass a user, redirect to signin
      window.location.href = `/auth/signin?callbackUrl=${window.location.pathname}`;
      return;
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      setError("No products to add to cart");
      alert("No products to add to cart");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      type Payload = { productIds: string[]; productVariantIds?: (string | null)[] };
      const payload: Payload = { productIds };
      if (Array.isArray(productVariantIds)) payload.productVariantIds = productVariantIds;

      const response = await fetch("/api/cart/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add items to cart");
      }

      alert(
        setName
          ? `Added all items from "${setName}" to your cart!`
          : `Added ${productIds.length} items to your cart!`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add items to cart";
      setError(message);
      alert(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Mirror ProductConfigurator logic for showing buttons (sign in / approval / active)
  const isSignedOut = !user && !session;
  const isUnapproved = (user && !user.approved) ?? false;

  if (isSignedOut) {
    return (
      <>
        <Button size="lg" className="w-full" asChild>
          <a href="/auth/signin">Sign In to Purchase</a>
        </Button>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </>
    );
  }

  if (isUnapproved) {
    return (
      <>
        <Button size="lg" className="w-full" disabled>
          Waiting on Account Approval
        </Button>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </>
    );
  }

  return (
    <>
      <Button size="lg" className="w-full md:w-auto" onClick={handleAddAllToCart} disabled={loading}>
        {loading ? "Adding..." : "Add All to Cart"}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </>
  );
}
