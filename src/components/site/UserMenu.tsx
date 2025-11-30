"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconLogOut, IconSettings, IconUser } from "@/components/ui/icons"

interface UserMenuProps {
  user: {
    role: "CUSTOMER" | "ADMIN"
    approved: boolean
    email: string | null
    name?: string | null
  } | null
}

export default function UserMenu({ user }: UserMenuProps) {
  // Dropdown behavior is handled by the Radix-based DropdownMenu component.

  // Show Sign In when not authenticated
  if (!user) {
    return (
      <div>
        <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    )
  }

  const label = user.name ?? user.email ?? "Account"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="hidden md:inline-flex items-center gap-2">
          <IconUser aria-hidden="true" />
          <span className="truncate max-w-40">{label}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="end" className="w-56">
        <div className="py-2 px-3 text-sm text-muted-foreground border-b">
          <div className="font-medium truncate">{user.name ?? user.email}</div>
          {user.email && <div className="text-xs opacity-80 truncate">{user.email}</div>}
        </div>

        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild className="focus:bg-secondary focus:text-secondary-foreground">
            <Link href="/admin" className="flex items-center gap-2">
              <IconSettings aria-hidden="true" />
              <span>Admin Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild className="focus:bg-secondary focus:text-secondary-foreground">
          <Link href="/account" className="flex items-center gap-2">
            <IconUser aria-hidden="true" />
            <span>Account settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          asChild
          onSelect={() => signOut({ callbackUrl: "/" })}
          className="focus:bg-secondary focus:text-secondary-foreground text-destructive"
        >
          <div className="flex items-center gap-2">
            <IconLogOut aria-hidden="true" />
            <span>Sign out</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
