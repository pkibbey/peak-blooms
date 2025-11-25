"use client";

import { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface ProductMultiSelectProps {
  products: Product[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  // New props for variant selection
  productSelections?: ProductSelection[];
  onSelectionsChange?: (selections: ProductSelection[]) => void;
  disabled?: boolean;
}

export default function ProductMultiSelect({
  products,
  selectedIds,
  onChange,
  productSelections = [],
  onSelectionsChange,
  disabled = false,
}: ProductMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (productId: string) => {
    if (disabled) return;
    
    if (selectedIds.includes(productId)) {
      onChange(selectedIds.filter((id) => id !== productId));
      // Also remove from selections
      if (onSelectionsChange) {
        onSelectionsChange(productSelections.filter(s => s.productId !== productId));
      }
    } else {
      onChange([...selectedIds, productId]);
      // Add to selections with first variant or null
      if (onSelectionsChange) {
        const product = products.find(p => p.id === productId);
        const firstVariantId = product?.variants?.[0]?.id ?? null;
        onSelectionsChange([...productSelections, { productId, productVariantId: firstVariantId }]);
      }
    }
  };

  const handleVariantChange = (productId: string, variantId: string | null) => {
    if (disabled || !onSelectionsChange) return;
    
    const updatedSelections = productSelections.map(s => 
      s.productId === productId 
        ? { ...s, productVariantId: variantId }
        : s
    );
    onSelectionsChange(updatedSelections);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    const filteredIds = filteredProducts.map((p) => p.id);
    const newSelected = [...new Set([...selectedIds, ...filteredIds])];
    onChange(newSelected);
    
    // Add selections for newly added products
    if (onSelectionsChange) {
      const existingProductIds = new Set(productSelections.map(s => s.productId));
      const newSelections = filteredProducts
        .filter(p => !existingProductIds.has(p.id))
        .map(p => ({ 
          productId: p.id, 
          productVariantId: p.variants?.[0]?.id ?? null 
        }));
      onSelectionsChange([...productSelections, ...newSelections]);
    }
  };

  const handleDeselectAll = () => {
    if (disabled) return;
    const filteredIds = new Set(filteredProducts.map((p) => p.id));
    onChange(selectedIds.filter((id) => !filteredIds.has(id)));
    
    // Remove from selections
    if (onSelectionsChange) {
      onSelectionsChange(productSelections.filter(s => !filteredIds.has(s.productId)));
    }
  };

  const getSelectedVariantId = (productId: string): string | null => {
    const selection = productSelections.find(s => s.productId === productId);
    return selection?.productVariantId ?? null;
  };

  const formatVariantLabel = (variant: ProductVariant): string => {
    const parts = [];
    if (variant.stemLength) parts.push(`${variant.stemLength}cm`);
    if (variant.countPerBunch) parts.push(`${variant.countPerBunch} stems`);
    parts.push(`$${variant.price.toFixed(2)}`);
    return parts.join(" • ");
  };

  const selectedCount = selectedIds.length;
  const filteredSelectedCount = filteredProducts.filter((p) =>
    selectedIds.includes(p.id)
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedCount} product{selectedCount !== 1 ? "s" : ""} selected
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="link" onClick={handleSelectAll} disabled={disabled} className="text-sm">
            Select visible
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDeselectAll} disabled={disabled} className="text-sm text-muted-foreground">
            Deselect visible
          </Button>
        </div>
      </div>

      <Input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        disabled={disabled}
      />

      <div className="max-h-96 overflow-y-auto rounded-md border border-border">
        {filteredProducts.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No products found
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filteredProducts.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              const hasVariants = product.variants && product.variants.length > 0;
              const selectedVariantId = getSelectedVariantId(product.id);
              
              return (
                <li key={product.id} className="p-3">
                  <Label
                    className={`flex cursor-pointer items-center gap-3 ${
                      disabled ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleToggle(product.id)}
                      disabled={disabled}
                      className="h-4 w-4 rounded"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{product.name}</p>
                      {product.category && (
                        <p className="truncate text-xs text-muted-foreground">
                          {product.category.name}
                        </p>
                      )}
                    </div>
                  </Label>
                  
                  {/* Variant Selector - shown when product is selected and has variants */}
                  {isSelected && hasVariants && onSelectionsChange && (
                    <div className="mt-2 ml-7">
                      <Select
                        value={selectedVariantId ?? "none"}
                        onValueChange={(value) => handleVariantChange(product.id, value === "none" ? null : value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select variant" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific variant</SelectItem>
                          {product.variants!.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {formatVariantLabel(variant)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {searchTerm && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
          {filteredSelectedCount > 0 && ` (${filteredSelectedCount} selected)`}
        </p>
      )}
    </div>
  );
}
