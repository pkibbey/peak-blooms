"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Inspiration {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  products?: {
    id: string;
  }[];
}

interface InspirationsTableProps {
  inspirations: Inspiration[];
}

export default function InspirationsTable({ inspirations }: InspirationsTableProps) {
  if (inspirations.length === 0) {
    return (
      <p className="text-muted-foreground">
        No inspirations found. Add your first inspiration to get started.
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
            <TableHead className="hidden md:table-cell">Slug</TableHead>
            <TableHead>Products</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inspirations.map((inspiration) => {
            const productCount = inspiration.products?.length || 0;

            return (
              <TableRow key={inspiration.id}>
                {/* Image */}
                <TableCell>
                  <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-muted">
                    {inspiration.image ? (
                      <Image
                        src={inspiration.image}
                        alt={inspiration.name}
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
                    href={`/admin/inspirations/${inspiration.id}/edit`}
                    className="text-primary font-medium hover:underline"
                  >
                    {inspiration.name}
                  </Link>
                </TableCell>

                {/* Slug */}
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  /{inspiration.slug}
                </TableCell>

                {/* Products Count */}
                <TableCell className="text-muted-foreground">
                  {productCount}
                </TableCell>                
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
