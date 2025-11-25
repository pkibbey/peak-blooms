"use client";

import { useState } from "react";
import { Label } from "../ui/label";

interface Product {
  id: string;
  name: string;
  category?: {
    name: string;
  };
}

interface ProductMultiSelectProps {
  products: Product[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export default function ProductMultiSelect({
  products,
  selectedIds,
  onChange,
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
    } else {
      onChange([...selectedIds, productId]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    const filteredIds = filteredProducts.map((p) => p.id);
    const newSelected = [...new Set([...selectedIds, ...filteredIds])];
    onChange(newSelected);
  };

  const handleDeselectAll = () => {
    if (disabled) return;
    const filteredIds = new Set(filteredProducts.map((p) => p.id));
    onChange(selectedIds.filter((id) => !filteredIds.has(id)));
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
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            Select visible
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={disabled}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Deselect visible
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        disabled={disabled}
      />

      <div className="max-h-64 overflow-y-auto rounded-md border border-border">
        {filteredProducts.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No products found
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filteredProducts.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <li key={product.id}>
                  <Label
                    className={`flex cursor-pointer items-center gap-3 p-3 hover:bg-muted ${
                      disabled ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(product.id)}
                      disabled={disabled}
                      className="h-4 w-4 rounded border-border"
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
