import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageFrame } from "@/components/ui/ImageFrame"
import { IconArrowRight } from "@/components/ui/icons"
import type { CollectionBasic } from "@/lib/query-types"

interface CollectionCardProps {
  collection: CollectionBasic
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const productCount = collection._count.productCollections

  return (
    <div className="group flex flex-col overflow-hidden rounded-xs transition-shadow border border-border">
      {/* Image Container */}
      <Link prefetch={false} href={`/collections/${collection.slug}`} className="group/link">
        <ImageFrame className="aspect-square">
          {collection.image && (
            <Image
              src={collection.image}
              alt={collection.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover absolute inset-0 z-10 transition-transform duration-300 group-hover:scale-105"
            />
          )}
          {productCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute bottom-3 left-3 bg-background/90 text-gray-700 backdrop-blur-sm"
            >
              {productCount} {productCount === 1 ? "Product" : "Products"}
            </Badge>
          )}
        </ImageFrame>
      </Link>

      {/* Card Content */}
      <div className="flex flex-col justify-between items-start bg-background p-6 grow">
        <div>
          <Link prefetch={false} href={`/collections/${collection.slug}`} className="group/link">
            <h3 className="text-xl font-bold group-hover/link:text-primary transition-colors font-serif">
              {collection.name}
            </h3>
          </Link>
          <p className="mt-2 text-base text-muted-foreground line-clamp-2">
            {collection.description}
          </p>
        </div>

        <Button
          className="mt-6"
          nativeButton={false}
          render={
            <Link
              prefetch={false}
              href={`/collections/${collection.slug}`}
              className="inline-flex items-center justify-center gap-2"
            >
              View Collection
              <IconArrowRight aria-hidden="true" />
            </Link>
          }
        />
      </div>
    </div>
  )
}
