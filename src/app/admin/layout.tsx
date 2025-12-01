import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"
import { getSession } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized")
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1 hidden lg:block">
            {/* Sidebar (server component fetches small summary counts) */}
            <AdminSidebar />
          </aside>

          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  )
}
