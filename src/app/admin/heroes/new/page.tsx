import HeroForm from "@/components/admin/HeroForm"
import BackLink from "@/components/site/BackLink"

export default async function NewHeroPage() {
  return (
    <>
      <BackLink href="/admin/heroes" label="Hero Banners" />
      <div className="mb-8">
        <h1 className="heading-1">Add New Hero Banner</h1>
        <p className="mt-2 text-muted-foreground">Create a new homepage hero banner</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <HeroForm />
      </div>
    </>
  )
}
