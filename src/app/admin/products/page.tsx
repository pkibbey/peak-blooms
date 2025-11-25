import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminProductCard from "@/components/admin/AdminProductCard";

export default async function AdminProductsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  const products = await db.product.findMany({
    include: {
      category: true,
      variants: {
        select: {
          id: true,
          price: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const featuredProducts = products.filter((p) => p.featured);
  const regularProducts = products.filter((p) => !p.featured);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your product catalog ({products.length} total)
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">Add Product</Link>
          </Button>
        </div>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 text-xl font-semibold">
              Featured Products ({featuredProducts.length})
            </h2>
            <div className="space-y-3">
              {featuredProducts.map((product) => (
                <AdminProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* All Products */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            {featuredProducts.length > 0 ? "Other Products" : "All Products"} ({regularProducts.length})
          </h2>
          {regularProducts.length === 0 ? (
            <p className="text-muted-foreground">
              {featuredProducts.length > 0
                ? "No other products found."
                : "No products found. Add your first product to get started."}
            </p>
          ) : (
            <div className="space-y-3">
              {regularProducts.map((product) => (
                <AdminProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-12">
          <Link href="/admin">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
