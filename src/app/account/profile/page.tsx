import BackLink from "@/components/site/BackLink"
import ProfileForm from "@/components/site/ProfileForm"
import { getCurrentUser } from "@/lib/auth-utils"

export default async function ProfilePage() {
  const user = await getCurrentUser()

  // User is guaranteed to exist due to layout auth check
  if (!user) return null

  return (
    <>
      <BackLink href="/account" label="Account" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif">Edit Profile</h1>
        <p className="mt-2 text-muted-foreground">Update your account details</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <ProfileForm user={{ id: user.id, name: user.name, email: user.email ?? "" }} />
      </div>
    </>
  )
}
