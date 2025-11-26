"use client";

import { useState } from "react";
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
  collection: {
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

type SortColumn = "name" | "collection" | "price" | "variants" | "featured";
type SortDirection = "asc" | "desc";

interface SortIndicatorProps {
  sortColumn: SortColumn;
  column: SortColumn;
  sortDirection: SortDirection;
}

const SortIndicator = ({
  sortColumn,
  column,
  sortDirection,
}: SortIndicatorProps) => {
  if (sortColumn !== column) {
    return <span className="ml-1 text-muted-foreground/50">↕</span>;
  }
  return <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>;
};

interface SortableHeaderProps {
  column: SortColumn;
  children: React.ReactNode;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

const SortableHeader = ({
  column,
  children,
  sortColumn,
  sortDirection,
  onSort,
}: SortableHeaderProps) => (
  <TableHead
    className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
    onClick={() => onSort(column)}
  >
    <span className="inline-flex items-center">
      {children}
      <SortIndicator
        sortColumn={sortColumn}
        column={column}
        sortDirection={sortDirection}
      />
    </span>
  </TableHead>
);

export default function ProductsTable({ products }: ProductsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
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
      case "collection":
        return direction * a.collection.name.localeCompare(b.collection.name);
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
            <SortableHeader
              column="name"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            >
              Name
            </SortableHeader>
            <SortableHeader
              column="collection"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            >
              Collection
            </SortableHeader>
            <SortableHeader
              column="price"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            >
              Price
            </SortableHeader>
            <SortableHeader
              column="variants"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            >
              Variants
            </SortableHeader>
            <SortableHeader
              column="featured"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            >
              Featured
            </SortableHeader>
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

                {/* Collection */}
                <TableCell className="text-muted-foreground">
                  {product.collection.name}
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
