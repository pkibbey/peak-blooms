import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import { FeaturedInInspirationSets } from "@/components/site/FeaturedInInspirationSets";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const products = await db.product.findMany({
    select: { slug: true },
  });
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
  });
  if (!product) return {};
  return {
    title: `${product.name} - Shop`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showPrice = !!(session?.user && (session.user as any).approved);

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      inspirationSets: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        {/* Navigation Back Link */}
        <Link
          href="/shop"
          className="text-sm font-medium text-primary hover:underline mb-8"
        >
          ← Back to shop
        </Link>

        {/* Product Detail Grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Product Image */}
          <div className="flex items-center justify-center">
            <div className="relative w-full aspect-square overflow-hidden rounded-xs bg-zinc-200">
              {product.image && (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="flex flex-col justify-start gap-6">
            {/* Breadcrumb */}
            <div className="text-sm text-muted-foreground">
              <Link href="/shop" className="hover:underline">
                Shop
              </Link>
              <span className="mx-2">/</span>
              <Link href={`/collections/${product.category.slug}`} className="hover:underline">
                {product.category.name}
              </Link>
              <span className="mx-2">/</span>
              <span>{product.name}</span>
            </div>

            {/* Product Title */}
            <div>
              <h1 className="text-4xl font-extrabold font-serif mb-2">
                {product.name}
              </h1>
              <p className="text-muted-foreground">
                {product.category.name}
              </p>
            </div>

            {/* Price */}
            {showPrice ? (
              <div className="text-3xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                Sign in to view pricing
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-lg text-muted-foreground">
                {product.description}
              </p>
            </div>

            {/* Product Specs */}
            {(product.stemLength || product.countPerBunch || product.stock > 0) && (
              <div className="border-t border-b border-gray-200 py-6">
                <div className="grid grid-cols-2 gap-4">
                  {product.stemLength && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                        Stem Length
                      </h3>
                      <p className="text-lg font-bold">
                        {product.stemLength} cm
                      </p>
                    </div>
                  )}
                  {product.countPerBunch && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                        Count per Bunch
                      </h3>
                      <p className="text-lg font-bold">
                        {product.countPerBunch} stems
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            {showPrice && product.stock > 0 ? (
              <Button size="lg" className="w-full">
                Add to Cart
              </Button>
            ) : !showPrice ? (
              <Button size="lg" className="w-full" asChild>
                <Link href="/auth/signin">Sign In to Purchase</Link>
              </Button>
            ) : (
              <Button size="lg" className="w-full" disabled>
                Out of Stock
              </Button>
            )}

            {/* Related Links */}
            <div className="pt-4">
              <Button asChild variant="ghost" className="w-full">
                <Link
                  href={`/collections/${product.category.slug}`}
                  className="inline-flex items-center justify-center gap-2"
                >
                  View More from {product.category.name}
                  <IconArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Featured in Inspiration Sets */}
        <FeaturedInInspirationSets inspirationSets={product.inspirationSets} />
      </div>
    </div>
  );
}
