import UsersTable from "@/components/admin/UsersTable"
import BackLink from "@/components/site/BackLink"
import { db } from "@/lib/db"

interface AdminUsersPageProps {
  searchParams: Promise<{ sort?: string; order?: string }>
}

export default async function UsersPage({ searchParams }: AdminUsersPageProps) {
  const { sort, order } = await searchParams

  // Fetch users from database (exclude newsletter subscribers)
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      approved: true,
      priceMultiplier: true,
      createdAt: true,
    },
  })

  // Sort based on query parameters
  const sortOrder = order as "asc" | "desc" | undefined

  if (sort === "name") {
    users.sort((a, b) => {
      const aName = a.name || ""
      const bName = b.name || ""
      const comparison = aName.localeCompare(bName)
      return sortOrder === "desc" ? -comparison : comparison
    })
  } else if (sort === "email") {
    users.sort((a, b) => {
      const aEmail = a.email || ""
      const bEmail = b.email || ""
      const comparison = aEmail.localeCompare(bEmail)
      return sortOrder === "desc" ? -comparison : comparison
    })
  } else if (sort === "role") {
    users.sort((a, b) => {
      const comparison = a.role.localeCompare(b.role)
      return sortOrder === "desc" ? -comparison : comparison
    })
  } else if (sort === "priceMultiplier") {
    users.sort((a, b) => {
      const comparison = a.priceMultiplier - b.priceMultiplier
      return sortOrder === "desc" ? -comparison : comparison
    })
  } else if (sort === "approved") {
    users.sort((a, b) => {
      const aVal = a.approved ? 1 : 0
      const bVal = b.approved ? 1 : 0
      const comparison = aVal - bVal
      return sortOrder === "desc" ? -comparison : comparison
    })
  } else if (sort === "createdAt") {
    users.sort((a, b) => {
      const comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortOrder === "desc" ? -comparison : comparison
    })
  } else {
    // Default sort: pending first, then by created date desc
    users.sort((a, b) => {
      if (a.approved === b.approved) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return a.approved ? 1 : -1
    })
  }

  const pendingCount = users.filter((u) => !u.approved).length
  const approvedCount = users.filter((u) => u.approved).length

  return (
    <>
      <BackLink href="/admin" label="Dashboard" />
      <div className="mb-8">
        <h1 className="heading-1">User Management</h1>
        <p className="mt-2 text-muted-foreground">
          Manage user accounts and permissions ({users.length} total • {pendingCount} pending •{" "}
          {approvedCount} approved)
        </p>
      </div>

      <UsersTable users={users} sort={sort} order={sortOrder} />
    </>
  )
}
