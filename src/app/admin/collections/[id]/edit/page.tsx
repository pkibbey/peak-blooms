import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import CollectionForm from "@/components/admin/CollectionForm";

interface EditCollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  const { id } = await params;

  const collection = await db.collection.findUnique({
    where: { id },
  });

  if (!collection) {
    notFound();
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin/collections" className="mb-4">← Back to Collections</Link>
          <h1 className="text-3xl font-bold">Edit Collection</h1>
          <p className="mt-2 text-muted-foreground">
            Update &ldquo;{collection.name}&rdquo;
          </p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <CollectionForm collection={collection} />
        </div>
      </div>
    </div>
  );
}
