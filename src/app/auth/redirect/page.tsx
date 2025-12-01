import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

interface RedirectPageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function AuthRedirectPage({ searchParams }: RedirectPageProps) {
  const params = await searchParams
  const session = await getSession()

  // If a signed-in admin reaches this route, send them to the admin dashboard.
  if (session?.user?.role === "ADMIN") {
    return redirect("/admin")
  }

  // Otherwise send them to the next param or home.
  const next = params?.next || "/"
  return redirect(next)
}
