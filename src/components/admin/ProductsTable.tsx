"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface ProductsTableProps {
  products: Product[];
}

type SortColumn = "name" | "category" | "price" | "variants" | "featured";
type SortDirection = "asc" | "desc";

export default function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter();
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleDelete = async (product: Product) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(product.id);
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
      setDeletingId(null);
    }
  };

  // Calculate price range helper
  const getPriceRange = (variants: { price: number }[]) => {
    const prices = variants.map((v) => v.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    return { minPrice, maxPrice };
  };

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    switch (sortColumn) {
      case "name":
        return direction * a.name.localeCompare(b.name);
      case "category":
        return direction * a.category.name.localeCompare(b.category.name);
      case "price":
        const aPrice = getPriceRange(a.variants).minPrice;
        const bPrice = getPriceRange(b.variants).minPrice;
        return direction * (aPrice - bPrice);
      case "variants":
        return direction * (a.variants.length - b.variants.length);
      case "featured":
        return direction * (Number(b.featured) - Number(a.featured));
      default:
        return 0;
    }
  });

  const SortIndicator = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <span className="ml-1 text-muted-foreground/50">↕</span>;
    }
    return (
      <span className="ml-1">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const SortableHeader = ({
    column,
    children,
  }: {
    column: SortColumn;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
      onClick={() => handleSort(column)}
    >
      <span className="inline-flex items-center">
        {children}
        <SortIndicator column={column} />
      </span>
    </TableHead>
  );

  if (products.length === 0) {
    return (
      <p className="text-muted-foreground">
        No products found. Add your first product to get started.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <SortableHeader column="name">Name</SortableHeader>
            <SortableHeader column="category">Category</SortableHeader>
            <SortableHeader column="price">Price</SortableHeader>
            <SortableHeader column="variants">Variants</SortableHeader>
            <SortableHeader column="featured">Featured</SortableHeader>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.map((product) => {
            const { minPrice, maxPrice } = getPriceRange(product.variants);
            const priceDisplay =
              minPrice === maxPrice
                ? `$${minPrice.toFixed(2)}`
                : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

            return (
              <TableRow key={product.id}>
                {/* Image */}
                <TableCell>
                  <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-muted">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Name */}
                <TableCell>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="text-primary font-medium hover:underline"
                  >
                    {product.name}
                  </Link>
                </TableCell>

                {/* Category */}
                <TableCell className="text-muted-foreground">
                  {product.category.name}
                </TableCell>

                {/* Price */}
                <TableCell>
                  {product.variants.length > 0 ? priceDisplay : "—"}
                </TableCell>

                {/* Variants */}
                <TableCell className="text-muted-foreground">
                  {product.variants.length}
                </TableCell>

                {/* Featured */}
                <TableCell>
                  {product.featured ? (
                    <Badge variant="secondary">Featured</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                    >
                      {deletingId === product.id ? "..." : "Delete"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
