import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminCategoryCard from "@/components/admin/AdminCategoryCard";

export default async function AdminCategoriesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  const categories = await db.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="mt-2 text-muted-foreground">
              Organize products into categories ({categories.length} total)
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/categories/new">Add Category</Link>
          </Button>
        </div>

        {/* Categories List */}
        <div>
          {categories.length === 0 ? (
            <p className="text-muted-foreground">
              No categories found. Add your first category to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <AdminCategoryCard key={category.id} category={category} />
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
