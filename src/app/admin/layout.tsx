import AdminSidebar from "@/components/admin/AdminSidebar"

/**
 * Admin layout is static. Server-side `middleware.ts` enforces authentication
 * and ADMIN role checks — no request-scoped APIs are used during render.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
