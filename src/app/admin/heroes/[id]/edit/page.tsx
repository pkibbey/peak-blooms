import { notFound } from "next/navigation"
import HeroForm from "@/components/admin/HeroForm"
import BackLink from "@/components/site/BackLink"
import { getTrackedDb } from "@/lib/db"

interface EditHeroPageProps {
  params: Promise<{ id: string }>
}

export default async function EditHeroPage({ params }: EditHeroPageProps) {
  const db = getTrackedDb(true)

  const { id } = await params

  const hero = await db.heroBanner.findUnique({
    where: { id },
  })

  if (!hero) {
    notFound()
  }

  return (
    <>
      <BackLink href="/admin/heroes" label="Hero Banners" />
      <div className="mb-8">
        <h1 className="heading-1">Edit Hero Banner</h1>
        <p className="mt-2 text-muted-foreground">Update hero banner details</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <HeroForm hero={hero} />
      </div>
    </>
  )
}
