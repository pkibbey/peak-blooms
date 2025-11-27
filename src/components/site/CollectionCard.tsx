import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconArrowRight } from "@/components/ui/icons"
import type { CollectionModel } from "@/generated/models"

interface CollectionCardProps {
  collection: CollectionModel & {
    _count?: {
      products: number
    }
  }
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const productCount = collection._count?.products ?? 0

  return (
    <div className="group flex flex-col overflow-hidden rounded-xs shadow-md transition-shadow hover:shadow-lg">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-zinc-200">
        {collection.image && (
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {productCount > 0 && (
          <Badge
            variant="secondary"
            className="absolute bottom-3 left-3 bg-white/90 text-gray-700 backdrop-blur-sm"
          >
            {productCount} {productCount === 1 ? "Product" : "Products"}
          </Badge>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-col justify-between bg-white p-6 grow">
        <div>
          <Link href={`/collections/${collection.slug}`} className="group/link">
            <h3 className="text-xl font-bold group-hover/link:text-primary transition-colors font-serif">
              {collection.name}
            </h3>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {collection.description}
          </p>
        </div>

        <Button asChild className="mt-6 w-full">
          <Link
            href={`/collections/${collection.slug}`}
            className="inline-flex items-center justify-center gap-2"
          >
            View Collection
            <IconArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
