"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import NavLink from "@/components/site/NavLink"
import SignInWithGoogle from "@/components/site/SignInWithGoogle"
import SignOutButton from "@/components/site/SignOutButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconMenu, IconSettings, IconShoppingCart, IconUser } from "@/components/ui/icons"
import type { SessionUser } from "@/lib/query-types"

type LinkItem = { label: string; href: string }

type Props = {
  user: SessionUser | null
  isApproved: boolean
  links: LinkItem[]
  cartCount: number
}

export default function MobileNav({ user, isApproved, links, cartCount }: Props) {
  const [open, setOpen] = useState(false)

  const panel = (
    <div className={`${open ? "" : "hidden"} mt-2 pb-4 border-t border-t-border`}>
      <div className="flex flex-col gap-1 py-2">
        {links.map((l) => (
          <NavLink key={l.href} href={l.href} className="px-4 py-2">
            {l.label}
          </NavLink>
        ))}

        {isApproved && (
          <Button
            variant="ghost"
            nativeButton={false}
            render={
              <Link
                prefetch={false}
                href="/cart"
                className="inline-flex items-center gap-2 px-4 py-2"
              >
                <IconShoppingCart aria-hidden="true" />
                <span>Cart</span>
                {cartCount > 0 && <Badge variant="default">{cartCount}</Badge>}
              </Link>
            }
          />
        )}

        {user ? (
          <>
            <NavLink href="/account" icon={<IconUser />} className="px-4 py-2">
              Account
            </NavLink>
            {user.role === "ADMIN" && (
              <NavLink href="/admin" icon={<IconSettings />} className="px-4 py-2">
                Admin Dashboard
              </NavLink>
            )}
            <SignOutButton />
          </>
        ) : (
          <>
            <SignInWithGoogle />
            <NavLink href="/auth/signup" className="px-4 py-2">
              Sign Up
            </NavLink>
          </>
        )}
      </div>
    </div>
  )

  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof document !== "undefined") {
      setPortalRoot(document.getElementById("mobile-nav-root"))
    }
  }, [])

  return (
    <div className="md:hidden">
      <Button
        size="icon"
        variant="default"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-label="Toggle menu"
      >
        <IconMenu aria-hidden="true" />
      </Button>

      {portalRoot ? createPortal(panel, portalRoot) : panel}
    </div>
  )
}
