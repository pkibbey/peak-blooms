import CollectionForm from "@/components/admin/CollectionForm"
import BackLink from "@/components/site/BackLink"

export default async function NewCollectionPage() {
  return (
    <>
      <BackLink href="/admin/collections" label="Collections" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Collection</h1>
        <p className="mt-2 text-muted-foreground">Create a new product collection</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <CollectionForm />
      </div>
    </>
  )
}
