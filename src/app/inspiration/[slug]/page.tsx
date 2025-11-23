import Link from "next/link";
import Image from "next/image";
import { inspirationSets, type InspirationSet } from "@/components/site/FeaturedInspiration";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/site/AddToCartButton";

interface InspirationDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return inspirationSets.map((set) => ({
    slug: set.slug,
  }));
}

export function generateMetadata({ params }: InspirationDetailPageProps) {
  const unwrappedParams = Promise.resolve(params);
  return unwrappedParams.then((p) => {
    const set = inspirationSets.find((s) => s.slug === p.slug);
    if (!set) return {};
    return {
      title: `${set.name} - Inspirational Sets`,
      description: set.subtitle,
    };
  });
}

export default async function InspirationDetailPage({
  params,
}: InspirationDetailPageProps) {
  const { slug } = await params;
  const set: InspirationSet | undefined = inspirationSets.find(
    (s) => s.slug === slug
  );

  if (!set) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-3xl px-6">
        {/* Navigation Back Link */}
        <Link
          href="/inspiration"
          className="text-sm font-medium text-primary hover:underline mb-8"
        >
          ← Back to inspiration
        </Link>

        {/* Featured Image */}
        <div className="relative aspect-square overflow-hidden rounded-xs shadow-md mb-12">
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
          <h1 className="text-4xl font-extrabold">{set.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{set.subtitle}</p>
        </div>

        {/* Inspiration Text */}
        <div className="mb-12 p-6 bg-secondary/30 rounded-xs">
          <h2 className="text-lg font-semibold mb-4">The Story</h2>
          <p className="text-base leading-relaxed text-gray-700">
            {set.inspirationText}
          </p>
        </div>

        {/* Add All to Cart Button */}
        <div className="mb-12">
          <AddToCartButton setName={set.name} />
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Flowers in This Set</h2>

          {/* Product Checklist Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/30 border-b border-gray-200">
                  <th className="text-left px-6 py-4 font-semibold">Product</th>
                  <th className="text-left px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {set.products.map((product, index) => (
                  <tr
                    key={product.slug}
                    className={`border-b border-gray-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-secondary/20 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/shop/${product.slug}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
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

        {/* Back Button */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/inspiration"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to inspiration
          </Link>
        </div>
      </div>
    </div>
  );
}
