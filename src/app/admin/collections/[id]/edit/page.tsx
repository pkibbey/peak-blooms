import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import CategoryForm from "@/components/admin/CategoryForm";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: EditCategoryPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  const { id } = await params;

  const category = await db.category.findUnique({
    where: { id },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin/collections" className="mb-4">← Back to Collections</Link>
          <h1 className="text-3xl font-bold">Edit Collection</h1>
          <p className="mt-2 text-muted-foreground">
            Update &ldquo;{category.name}&rdquo;
          </p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <CategoryForm category={category} />
        </div>
      </div>
    </div>
  );
}
