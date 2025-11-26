import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import BackLink from "@/components/site/BackLink";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  const { id } = await params;

  const [product, collections] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: [
            { stemLength: "asc" },
            { countPerBunch: "asc" },
          ],
        },
      },
    }),
    db.collection.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <BackLink href="/admin/products" label="Products" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="mt-2 text-muted-foreground">
            Update &ldquo;{product.name}&rdquo;
          </p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <ProductForm collections={collections} product={product} />
        </div>
      </div>
    </div>
  );
}
