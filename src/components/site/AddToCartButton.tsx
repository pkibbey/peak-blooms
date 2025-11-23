"use client";

import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  setName: string;
}

export default function AddToCartButton({ setName }: AddToCartButtonProps) {
  const handleAddToCart = () => {
    // Placeholder: cart functionality will be implemented later
    console.log(`Added all products from ${setName} to cart`);
    alert(
      `Added all products from "${setName}" to cart! (Placeholder functionality)`
    );
  };

  return (
    <Button size="lg" className="w-full md:w-auto" onClick={handleAddToCart}>
      Add All to Cart
    </Button>
  );
}
