import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  const collections = await db.collection.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin/products" className="mb-4 inline-block">← Back to Products</Link>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="mt-2 text-muted-foreground">
            Create a new product listing
          </p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <ProductForm collections={collections} />
        </div>
      </div>
    </div>
  );
}
