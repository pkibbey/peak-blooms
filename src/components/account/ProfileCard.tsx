import ProfileForm from "@/components/site/ProfileForm"
import type { SessionUser } from "@/lib/query-types"

interface ProfileCardProps {
  user: SessionUser
}

export default function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div className="rounded-lg border border-border p-6">
      <div className="mb-6">
        <h2 className="heading-3">Profile</h2>
        <p className="mt-2 text-sm text-muted-foreground">Update your account details</p>
      </div>
      <ProfileForm user={user} />
    </div>
  )
}
