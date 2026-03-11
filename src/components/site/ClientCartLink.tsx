"use client"

import Link from "next/link"
import { IconShoppingCart } from "@/components/ui/icons"
import { useSession } from "@/lib/auth-client"
import type { SessionUser } from "@/lib/query-types"

export default function ClientCartLink() {
  const { data: session } = useSession()
  // better-auth's session type is loose by default; we know our user shape is
  // SessionUser so cast accordingly rather than using `any`.
  const user = session?.user as SessionUser | undefined
  const isApproved = !!user?.approved

  // Client-side cart visibility only for approved users. Cart count is intentionally
  // omitted here (can be added later with a client fetch to a cart API).
  if (!isApproved) return null

  return (
    <Link href="/cart" className="inline-flex items-center gap-2">
      <IconShoppingCart aria-hidden="true" />
    </Link>
  )
}
