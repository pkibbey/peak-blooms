import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import AddAllToCartButton from "@/components/site/AddAllToCartButton";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

interface InspirationDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const sets = await db.inspirationSet.findMany({
    select: { slug: true },
  });
  return sets.map((set) => ({
    slug: set.slug,
  }));
}

export async function generateMetadata({ params }: InspirationDetailPageProps) {
  const { slug } = await params;
  const set = await db.inspirationSet.findUnique({
    where: { slug },
  });
  if (!set) return {};
  return {
    title: `${set.name} - Inspirational Sets`,
    description: set.subtitle,
  };
}

export default async function InspirationDetailPage({
  params,
}: InspirationDetailPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const set = await db.inspirationSet.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          product: {
            include: {
              variants: true,
            },
          },
          productVariant: true,
        },
      },
    },
  });

  if (!set) {
    notFound();
  }

  // Extract products with their selected variants from the join table
  const productsWithVariants = set.products.map((sp) => ({
    ...sp.product,
    selectedVariant: sp.productVariant,
    // Use the selected variant or fall back to first variant
    displayVariant: sp.productVariant ?? sp.product.variants[0] ?? null,
  }));

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        {/* Navigation Back Link */}
        <Link
          href="/inspirations"
          className="text-sm font-medium text-primary hover:underline mb-8"
        >
          ← Back to inspirations
        </Link>

        {/* Featured Image */}
        <div className="relative aspect-video overflow-hidden rounded-xs shadow-md mb-12">
          <Image
            src={set.image}
            alt={set.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Set Title and Subtitle */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold font-serif">{set.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{set.subtitle}</p>
        </div>

        {/* Inspiration Text */}
        <div className="mb-12 p-6 bg-secondary/30 rounded-xs">
          <h2 className="text-lg font-semibold mb-4">The Story</h2>
          <p className="text-base leading-relaxed text-gray-700">
            {set.inspirationText}
          </p>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Flowers in This Set</h2>

          {/* Product Checklist Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/30 border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-semibold">Image</th>
                  <th className="text-left px-6 py-4 font-semibold">Product</th>
                  <th className="text-left px-6 py-4 font-semibold">Variant</th>
                  <th className="text-left px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {productsWithVariants.map((product, index) => (
                  <tr
                    key={product.slug}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-secondary/20 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/shop/${product.slug}`}
                        className="block"
                      >
                        {product.image ? (
                          <div className="relative h-16 w-16 overflow-hidden rounded-sm bg-gray-100">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-sm bg-gray-200 flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/shop/${product.slug}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {product.displayVariant ? (
                        <div className="text-sm text-muted-foreground">
                          <div className="font-medium">${product.displayVariant.price.toFixed(2)}</div>
                          <div className="text-xs">
                            {product.displayVariant.stemLength ? `${product.displayVariant.stemLength}cm` : ""}
                            {product.displayVariant.stemLength && product.displayVariant.countPerBunch ? " · " : ""}
                            {product.displayVariant.countPerBunch ? `${product.displayVariant.countPerBunch} stems` : ""}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No variant</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <svg
                          className="h-5 w-5 text-primary"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Included
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add All to Cart Button */}
        <div className="mt-12">
          <AddAllToCartButton
            productIds={productsWithVariants.map((p) => p.id)}
            productVariantIds={productsWithVariants.map((p) => p.displayVariant?.id ?? null)}
            setName={set.name}
            user={user}
          />
        </div>

        {/* Back Button */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/inspirations"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to inspirations
          </Link>
        </div>
      </div>
    </div>
  );
}
