import AddressesCard from "@/components/account/AddressesCard"
import OrderHistoryCard from "@/components/account/OrderHistoryCard"
import ProfileCard from "@/components/account/ProfileCard"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"

const ITEMS_PER_PAGE = 10

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getCurrentUser()

  // User is guaranteed to exist due to layout auth check
  if (!user) return null

  const params = await searchParams
  const currentPage = Math.max(1, parseInt(String(params.page || "1")))

  // Fetch all user data in parallel
  const [addresses, totalOrders] = await Promise.all([
    db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    db.order.count({
      where: { userId: user.id },
    }),
  ])

  // Fetch paginated orders
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    take: ITEMS_PER_PAGE,
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
  })

  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE)

  return (
    <>
      <div className="mb-8">
        <h1 className="heading-1">Account Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile, addresses, and order history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* <ProfileCard user={{ id: user.id, name: user.name, email: user.email ?? "" }} /> */}
        <AddressesCard addresses={addresses} />
      </div>

      <div className="mt-8">
        <OrderHistoryCard
          orders={orders}
          currentPage={currentPage}
          totalPages={totalPages}
          searchParams={params}
        />
      </div>
    </>
  )
}
