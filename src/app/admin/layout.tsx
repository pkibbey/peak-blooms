import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"
import { getSession } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session?.user) {
    // If the visitor is not signed in, send them to the sign-in page.
    // We redirect unauthenticated users to the sign-in flow rather than
    // allowing the admin layout to attempt rendering the unauthorized page
    // (which previously lived under the same layout and caused a redirect
    // loop).
    redirect("/auth/signin?callbackUrl=/admin")
  }

  if (session.user.role !== "ADMIN") {
    // Signed-in users without admin privileges can be shown the standalone
    // admin-unauthorized page (outside the admin layout).
    redirect("/admin-unauthorized")
  }

  return (
    <div className="bg-primary/10 bg-admin-pattern">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-6">
          {/* Top navigation for admin pages */}
          <AdminSidebar />
        </header>

        <main className="bg-primary-foreground border border-border px-6 py-4 rounded-sm overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
