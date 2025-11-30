import ApprovedUserCard from "@/components/admin/ApprovedUserCard"
import PendingUserCard from "@/components/admin/PendingUserCard"
import BackLink from "@/components/site/BackLink"
import { db } from "@/lib/db"

interface User {
  id: string
  email: string | null
  name: string | null
  approved: boolean
  priceMultiplier: number
  createdAt: string
}

export default async function UsersPage() {
  // Fetch users directly from database on the server
  let users: User[] = []
  try {
    const dbUsers = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        approved: true,
        priceMultiplier: true,
        createdAt: true,
      },
      orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    })
    users = dbUsers.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching users:", error)
  }

  const pendingUsers = users.filter((u) => !u.approved)
  const approvedUsers = users.filter((u) => u.approved)

  return (
    <>
      <BackLink href="/admin" label="Dashboard" />
      <div className="mb-8">
        <h1 className="heading-1">User Management</h1>
        <p className="mt-2 text-muted-foreground">Review and approve new user accounts</p>
      </div>

      {/* Pending Approvals */}
      <div className="mb-12">
        <h2 className="mb-4 heading-2">Pending Approval ({pendingUsers.length})</h2>
        {pendingUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending user approvals</p>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <PendingUserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>

      {/* Approved Users */}
      <div>
        <h2 className="mb-4 heading-2">Approved Users ({approvedUsers.length})</h2>
        {approvedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approved users yet</p>
        ) : (
          <div className="space-y-3">
            {approvedUsers.map((user) => (
              <ApprovedUserCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
