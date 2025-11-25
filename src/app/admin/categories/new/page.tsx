import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CategoryForm from "@/components/admin/CategoryForm";

export default async function NewCategoryPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin/categories" className="mb-4">← Back to Categories</Link>
          <h1 className="text-3xl font-bold">Add New Category</h1>
          <p className="mt-2 text-muted-foreground">
            Create a new product category
          </p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <CategoryForm />
        </div>
      </div>
    </div>
  );
}
