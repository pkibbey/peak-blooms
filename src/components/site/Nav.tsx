"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import NavLink from "@/components/site/NavLink"
import UserMenu from "@/components/site/UserMenu"
import { IconMenu, IconSettings, IconShoppingCart, IconUser, IconX } from "@/components/ui/icons"
import { signOut } from "@/lib/auth-client"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

const links = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Inspirations", href: "/inspirations" },
]

interface NavProps {
  user: {
    role: "CUSTOMER" | "ADMIN"
    approved: boolean
    email: string | null
    name?: string | null
  } | null
  cartCount?: number
}

export default function Nav({ user, cartCount = 0 }: NavProps) {
  const [open, setOpen] = useState(false)
  const isApproved = user?.approved === true

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-sm border-b border-b-border">
      <a href="#content" className="sr-only focus:not-sr-only focus:sr-only:block px-4 py-2">
        Skip to content
      </a>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold">
              <Image
                src="/logos/peakblooms.png"
                alt="Peak Blooms logo"
                width={384}
                height={44}
                loading="eager"
                className="h-8 w-[139px] shrink-0"
              />
            </Link>

            <nav className="hidden md:flex md:items-center md:gap-1" aria-label="Primary">
              {links.map((l) => (
                <NavLink key={l.href} href={l.href}>
                  {l.label}
                </NavLink>
              ))}

              {/* Admin link used to appear inline here; now handled inside the user menu */}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isApproved && (
              <div className="hidden md:block">
                <Link href="/cart" className="inline-flex items-center gap-2">
                  <IconShoppingCart aria-hidden="true" />
                  <span>Cart</span>
                  {cartCount > 0 && <Badge variant="default">{cartCount}</Badge>}
                </Link>
              </div>
            )}

            {/* Consolidated user/account/admin menu */}
            <UserMenu user={user} />

            <Button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              size="icon"
              className="md:hidden"
              variant="default"
            >
              {open ? <IconX aria-hidden="true" /> : <IconMenu aria-hidden="true" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden mt-2 pb-4 border-t border-t-border">
            <div className="flex flex-col gap-1 py-2">
              {links.map((l) => (
                <NavLink key={l.href} href={l.href} className="px-4 py-2">
                  {l.label}
                </NavLink>
              ))}
              {isApproved && (
                <Button asChild variant="ghost">
                  <Link href="/cart" className="inline-flex items-center gap-2 px-4 py-2">
                    <IconShoppingCart aria-hidden="true" />
                    <span>Cart</span>
                    {cartCount > 0 && <Badge variant="default">{cartCount}</Badge>}
                  </Link>
                </Button>
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
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await signOut()
                    }}
                    className="text-destructive"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/auth/signin" className="px-4 py-2">
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/signup" className="px-4 py-2">
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
