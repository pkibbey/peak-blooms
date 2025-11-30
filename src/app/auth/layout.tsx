import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { getCurrentUser } from "@/lib/current-user"

export const metadata = {
  title: "Sign in — Peak Blooms",
}

export default async function AuthLayout({ children }: { children: ReactNode }) {
  // If there's a signed-in user for this request, send them home — auth pages
  // should only be accessible to unauthenticated visitors.
  const user = await getCurrentUser()

  if (user) {
    // server-side redirect
    redirect("/")
  }

  return <>{children}</>
}
