import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CollectionForm from "@/components/admin/CollectionForm";

interface EditCollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInspirationPage({ params }: EditCollectionPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  const { id } = await params;

  const [collection, products] = await Promise.all([
    db.inspirationSet.findUnique({
      where: { id },
      include: {
        products: {
          select: { 
            productId: true,
            productVariantId: true,
          },
        },
      },
    }),
    db.product.findMany({
      include: {
        category: {
          select: { name: true },
        },
        variants: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!collection) {
    notFound();
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin/inspirations" className="mb-4">← Back to Inspirations</Link>
          <h1 className="text-3xl font-bold">Edit Inspiration</h1>
          <p className="mt-2 text-muted-foreground">
            Update &ldquo;{collection.name}&rdquo;
          </p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <CollectionForm products={products} collection={collection} />
        </div>
      </div>
    </div>
  );
}
