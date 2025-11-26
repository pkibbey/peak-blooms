import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import CollectionForm from "@/components/admin/CollectionForm";
import BackLink from "@/components/site/BackLink";

export default async function NewCollectionPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <BackLink href="/admin/collections" label="Collections" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Add New Collection</h1>
          <p className="mt-2 text-muted-foreground">
            Create a new product collection
          </p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <CollectionForm />
        </div>
      </div>
    </div>
  );
}
