import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/current-user"

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin?callbackUrl=/account")
  }

  return <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">{children}</div>
}
