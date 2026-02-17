"use client"

import Link from "next/link"
import { IconShoppingCart } from "@/components/ui/icons"
import { useSession } from "@/lib/auth-client"

export default function ClientCartLink() {
  const { data: session } = useSession()
  const isApproved = !!(session?.user as any)?.approved

  // Client-side cart visibility only for approved users. Cart count is intentionally
  // omitted here (can be added later with a client fetch to a cart API).
  if (!isApproved) return null

  return (
    <Link href="/cart" className="inline-flex items-center gap-2">
      <IconShoppingCart aria-hidden="true" />
    </Link>
  )
}
