import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import CollectionForm from "@/components/admin/CollectionForm";

export default async function NewInspirationPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  const products = await db.product.findMany({
    include: {
      category: {
        select: { name: true },
      },
      variants: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin/inspirations" className="mb-4">← Back to Inspirations</Link>
          <h1 className="text-3xl font-bold">Add New Inspiration</h1>
          <p className="mt-2 text-muted-foreground">
            Create a new inspiration set
          </p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <CollectionForm products={products} />
        </div>
      </div>
    </div>
  );
}
