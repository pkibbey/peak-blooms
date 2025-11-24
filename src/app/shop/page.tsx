import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/site/ProductCard";

export const metadata = {
  title: "Shop",
  description: "Browse our full catalog of premium flowers",
};

export default async function ShopPage() {
  const session = await auth();
  // Check if user is approved to see prices.
  // We cast to any because the custom properties on session.user might not be fully typed in the project yet
  const showPrice = !!(session?.user && (session.user as any).approved);

  const products = await db.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold font-serif">Shop</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Browse our full catalog of premium flowers
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} hidePrice={!showPrice} />
          ))}
        </div>
      </div>
    </div>
  );
}
