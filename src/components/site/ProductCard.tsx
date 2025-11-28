"use client"

import Image from "next/image"
import Link from "next/link"
import { ProductControls } from "@/components/site/ProductControls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconArrowRight, IconPackage } from "@/components/ui/icons"
import type { ProductModel, ProductVariantModel } from "@/generated/models"

interface ProductCardProps {
  product: ProductModel & {
    variants?: ProductVariantModel[]
  }
  user?: {
    approved: boolean
  } | null
}

export function ProductCard({ product, user }: ProductCardProps) {
  const hasBoxlotVariant = product.variants?.some((v) => v.isBoxlot) ?? false

  return (
    <div className="group flex flex-col overflow-hidden rounded-xs shadow-md transition-shadow hover:shadow-lg">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-zinc-200">
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {/* Boxlot Badge */}
        {hasBoxlotVariant && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100"
          >
            <IconPackage className="h-3 w-3" />
            Boxlot
          </Badge>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-col justify-between bg-white p-6 grow">
        <div>
          <h3 className="text-xl font-bold font-serif">{product.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        </div>

        <ProductControls product={product} user={user} mode="card" />

        {/* View Product Button */}
        <div className="mt-3">
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link
              href={`/shop/${product.slug}`}
              className="inline-flex items-center justify-center gap-2"
            >
              View Details
              <IconArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
