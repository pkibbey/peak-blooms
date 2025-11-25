import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminCollectionCard from "@/components/admin/AdminCollectionCard";

export default async function AdminInspirationsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  const collections = await db.inspirationSet.findMany({
    include: {
      products: {
        select: { id: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inspirations</h1>
            <p className="mt-2 text-muted-foreground">
              Curate inspiration sets ({collections.length} total)
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/inspirations/new">Add Inspiration</Link>
          </Button>
        </div>

        {/* Inspirations List */}
        <div>
          {collections.length === 0 ? (
            <p className="text-muted-foreground">
              No inspirations found. Add your first inspiration to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {collections.map((collection) => (
                <AdminCollectionCard key={collection.id} collection={collection} />
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
