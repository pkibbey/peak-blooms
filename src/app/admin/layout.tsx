import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized")
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">{children}</div>
    </div>
  )
}
