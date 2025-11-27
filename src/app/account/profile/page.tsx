import BackLink from "@/components/site/BackLink"
import { Badge } from "@/components/ui/badge"
import { IconCheckCircle, IconClock, IconUser } from "@/components/ui/icons"
import { getCurrentUser } from "@/lib/auth-utils"

export default async function ProfilePage() {
  const user = await getCurrentUser()

  // User is guaranteed to exist due to layout auth check
  if (!user) return null

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(new Date(date))
  }

  return (
    <>
      <BackLink href="/account" label="Account" />
      <div className="bg-white rounded-xs shadow-sm border p-6">
      <h2 className="text-lg font-semibold font-serif mb-4 flex items-center gap-2">
        <IconUser className="h-5 w-5" />
        Profile
      </h2>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="font-medium">{user.name || "Not set"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Account Status</p>
          <div className="flex items-center gap-2">
            {user.approved ? (
              <Badge variant="default">
                <IconCheckCircle className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            ) : (
              <Badge variant="secondary">
                <IconClock className="h-3 w-3 mr-1" />
                Pending Approval
              </Badge>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Member Since</p>
          <p className="font-medium">{formatDate(user.createdAt)}</p>
        </div>
      </div>
    </div>
    </>
  )
}
