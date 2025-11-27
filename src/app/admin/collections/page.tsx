import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CollectionsTable from "@/components/admin/CollectionsTable";
import BackLink from "@/components/site/BackLink";

export default async function AdminCollectionsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  const collections = await db.collection.findMany({
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
        <BackLink href="/admin" label="Dashboard" />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Collections</h1>
            <p className="mt-2 text-muted-foreground">
              Organize products into collections ({collections.length} total)
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/collections/new">Add New Collection</Link>
          </Button>
        </div>

        {/* Collections Table */}
        <CollectionsTable collections={collections} />
      </div>
    </div>
  );
}
