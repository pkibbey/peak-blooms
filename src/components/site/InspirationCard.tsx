import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconArrowRight } from "@/components/ui/icons"
import type { InspirationBasic } from "@/lib/query-types"

interface InspirationCardProps {
  inspiration: InspirationBasic & {
    _count?: {
      products: number
    }
  }
}

export function InspirationCard({ inspiration }: InspirationCardProps) {
  const productCount = inspiration._count?.products ?? 0

  return (
    <div className="group flex flex-row overflow-hidden rounded-xs shadow-md transition-shadow hover:shadow-lg bg-background border border-border">
      {/* Image Container */}
      <div className="relative w-2/5 shrink-0 overflow-hidden bg-zinc-200">
        <Image
          src={inspiration.image}
          alt={inspiration.name}
          fill
          sizes="(max-width: 768px) 40vw, (max-width: 1200px) 20vw, 15vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {productCount > 0 && (
          <Badge
            variant="secondary"
            className="absolute bottom-3 left-3 bg-background/90 text-gray-700 backdrop-blur-sm"
          >
            {productCount} {productCount === 1 ? "Product" : "Products"}
          </Badge>
        )}
      </div>

      {/* Content Container */}
      <div className="flex flex-col justify-between p-6 grow">
        <div>
          <Link prefetch={false} href={`/inspirations/${inspiration.slug}`} className="group/link">
            <h3 className="text-xl font-bold group-hover/link:text-primary transition-colors font-serif">
              {inspiration.name}
            </h3>
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{inspiration.subtitle}</p>
          <p className="mt-3 text-sm leading-relaxed text-gray-700 line-clamp-3">
            {inspiration.excerpt}
          </p>
        </div>

        <Button
          className="mt-4 w-full"
          nativeButton={false}
          render={
            <Link
              prefetch={false}
              href={`/inspirations/${inspiration.slug}`}
              className="inline-flex items-center justify-center gap-2"
            >
              View Inspiration
              <IconArrowRight aria-hidden="true" />
            </Link>
          }
        ></Button>
      </div>
    </div>
  )
}
