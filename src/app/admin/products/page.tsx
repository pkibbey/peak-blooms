import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProductsTable from "@/components/admin/ProductsTable";
import BackLink from "@/components/site/BackLink";

export default async function AdminProductsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  const products = await db.product.findMany({
    include: {
      collection: true,
      variants: {
        select: {
          id: true,
          price: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <BackLink href="/admin" label="Dashboard" />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your product catalog ({products.length} total)
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">Add New Product</Link>
          </Button>
        </div>

        <ProductsTable products={products} />
      </div>
    </div>
  );
}
