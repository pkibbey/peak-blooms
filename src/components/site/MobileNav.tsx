"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
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

  const panelRef = useRef<HTMLDivElement | null>(null)

  const panel = (
    <div ref={panelRef} className={`${open ? "" : "hidden"} mt-2 pb-4 border-t border-t-border`}>
      <div className="flex flex-col gap-1 py-2">
        {links.map((l) => (
          <NavLink key={l.href} href={l.href} className="px-4 py-2" onClick={() => setOpen(false)}>
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
                onClick={() => setOpen(false)}
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
            <NavLink
              href="/account"
              icon={<IconUser />}
              className="px-4 py-2"
              onClick={() => setOpen(false)}
            >
              Account
            </NavLink>
            {user.role === "ADMIN" && (
              <NavLink
                href="/admin"
                icon={<IconSettings />}
                className="px-4 py-2"
                onClick={() => setOpen(false)}
              >
                Admin Dashboard
              </NavLink>
            )}
            <SignOutButton onDone={() => setOpen(false)} />
          </>
        ) : (
          <>
            <SignInWithGoogle onDone={() => setOpen(false)} />
            <NavLink href="/auth/signup" className="px-4 py-2" onClick={() => setOpen(false)}>
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

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!open) return
      const target = e.target as HTMLElement | null
      const panelEl = panelRef.current
      if (!panelEl) return
      // If click is inside the panel, ignore
      if (target && panelEl.contains(target)) return
      // If click is on the toggle button, ignore (toggle handles it)
      if (target?.closest('[aria-label="Toggle menu"]')) return
      setOpen(false)
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [open])

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
