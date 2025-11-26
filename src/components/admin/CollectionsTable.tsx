"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Collection {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count?: {
    products: number;
  };
}

interface CollectionsTableProps {
  collections: Collection[];
}

export default function CollectionsTable({ collections }: CollectionsTableProps) {
  if (collections.length === 0) {
    return (
      <p className="text-muted-foreground">
        No collections found. Add your first collection to get started.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.map((collection) => (
            <TableRow key={collection.id}>
              {/* Image */}
              <TableCell>
                <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-muted">
                  {collection.image ? (
                    <Image
                      src={collection.image}
                      alt={collection.name}
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
                  href={`/admin/collections/${collection.id}/edit`}
                  className="text-primary font-medium hover:underline"
                >
                  {collection.name}
                </Link>
              </TableCell>

              {/* Slug */}
              <TableCell className="text-muted-foreground">
                /{collection.slug}
              </TableCell>

              {/* Products Count */}
              <TableCell className="text-muted-foreground">
                {collection._count?.products || 0}
              </TableCell>

              {/* Actions */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/collections/${collection.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
