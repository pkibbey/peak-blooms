import Image from "next/image"
import { notFound } from "next/navigation"
import BackLink from "@/components/site/BackLink"
import { InspirationProductTable } from "@/components/site/InspirationProductTable"
import { getCurrentUser } from "@/lib/current-user"
import { getInspirationBySlug } from "@/lib/data"
import { db } from "@/lib/db"

interface InspirationDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: InspirationDetailPageProps) {
  const { slug } = await params
  const inspiration = await db.inspiration.findUnique({
    where: { slug },
  })
  if (!inspiration) return {}
  return {
    title: `${inspiration.name} - Inspirations`,
    description: inspiration.subtitle,
  }
}

export default async function InspirationDetailPage({ params }: InspirationDetailPageProps) {
  const { slug } = await params
  const user = await getCurrentUser()
  const multiplier = user?.priceMultiplier ?? 1.0

  const inspiration = await getInspirationBySlug(slug, multiplier)

  if (!inspiration) {
    notFound()
  }

  // Extract products from the join table
  // Prices are already adjusted by the DAL
  const productsWithVariants = inspiration.products.map((sp) => ({
    ...sp.product,
    quantity: sp.quantity ?? 1,
  }))

  return (
    <div className="flex flex-col items-center justify-start bg-white py-12 sm:py-16 font-sans">
      <div className="w-full max-w-5xl px-4 md:px-6">
        {/* Navigation Back Link */}
        <BackLink href="/inspirations" label="inspirations" />

        {/* Header Section - Enhanced typography and spacing */}
        <div className="mb-8 md:mb-12">
          <h1 className="heading-1 text-4xl md:text-5xl mb-3 text-primary">{inspiration.name}</h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
            {inspiration.subtitle}
          </p>
        </div>

        {/* Featured Image - Enhanced with larger aspect ratio */}
        <div className="relative aspect-video overflow-hidden rounded-lg shadow-lg mb-6 md:mb-12">
          <Image
            src={inspiration.image}
            alt={inspiration.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Inspiration Story Section - Enhanced styling */}
        <div className="mb-8 md:mb-12">
          <div className="max-w-3xl">
            <h2 className="heading-2 text-2xl md:text-3xl mb-6 text-primary flex items-center">
              <span className="w-1 h-8 bg-primary rounded-full mr-4"></span>
              The Story
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-gray-700 whitespace-pre-line">
              {inspiration.inspirationText}
            </p>
          </div>
        </div>

        {/* Products Section - Combined with interactive quantities and CTA */}
        <div className="w-full mb-8 md:mb-12">
          <h2 className="heading-2 text-2xl md:text-3xl mb-2 text-primary flex items-center">
            <span className="w-1 h-8 bg-primary rounded-full mr-4"></span>
            Flowers in This Set
          </h2>
          <p className="text-gray-500 mb-4 text-sm md:text-base">
            Adjust quantities as needed—these are suggested amounts based on the inspiration
          </p>

          <InspirationProductTable
            products={productsWithVariants}
            setName={inspiration.name}
            user={user}
          />
        </div>
      </div>
    </div>
  )
}
