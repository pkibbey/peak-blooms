import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import { db } from "@/lib/db";

interface CollectionDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const categories = await db.category.findMany({
    select: { slug: true },
  });
  return categories.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({ params }: CollectionDetailPageProps) {
  const { slug } = await params;
  const category = await db.category.findUnique({
    where: { slug },
  });
  if (!category) return {};
  return {
    title: `${category.name} - Collections`,
    description: category.description,
  };
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const { slug } = await params;
  const category = await db.category.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        {/* Navigation Back Link */}
        <Link
          href="/collections"
          className="text-sm font-medium text-primary hover:underline mb-8"
        >
          ← Back to collections
        </Link>

        {/* Collection Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold font-serif">
            {category.name}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {category.description}
          </p>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 font-serif">
            Products in this collection
          </h2>

          {category.products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No products available in this collection yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {category.products.map((product) => (
                <div
                  key={product.slug}
                  className="group flex flex-col overflow-hidden rounded-xs shadow-md transition-shadow hover:shadow-lg"
                >
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
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-col justify-between bg-white p-6">
                    <div>
                      <h3 className="text-xl font-bold font-serif">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      <div className="text-lg font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </div>
                      <Button asChild className="w-full">
                        <Link
                          href={`/shop/${product.slug}`}
                          className="inline-flex items-center justify-center gap-2"
                        >
                          View Product
                          <IconArrowRight aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/collections"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to collections
          </Link>
        </div>
      </div>
    </div>
  );
}
