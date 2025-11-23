"use client"

import { useState } from "react"
import Link from "next/link"
import NavLink from "@/components/site/NavLink"
import { cn } from "@/lib/utils"

const links = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-sm border-b border-b-border">
      <a href="#content" className="sr-only focus:not-sr-only focus:sr-only:block px-4 py-2">
        Skip to content
      </a>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold">
              <span className="inline-block h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 via-rose-400 to-amber-400 shadow" />
              <span className="hidden sm:inline">Peak Blooms</span>
            </Link>

            <nav className="hidden md:flex md:items-center md:gap-1 md:ml-2" aria-label="Primary">
              {links.map((l) => (
                <NavLink key={l.href} href={l.href}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <Link href="/cart" className="px-3 py-2 text-sm rounded-md hover:bg-accent/50">
                Cart
              </Link>
            </div>

            <button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden",
                open ? "bg-accent/30" : "hover:bg-accent/10"
              )}
            >
              {open ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
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
              <Link href="/cart" className="px-4 py-2 text-sm rounded-md hover:bg-accent/50">
                Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
