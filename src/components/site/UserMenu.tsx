"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconLogOut, IconSettings, IconUser } from "@/components/ui/icons"
import { signOut } from "@/lib/auth-client"

interface UserMenuProps {
  user: {
    role: "CUSTOMER" | "ADMIN"
    approved: boolean
    email: string | null
    name?: string | null
  } | null
}

export default function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()

  // Dropdown behavior is handled by the Radix-based DropdownMenu component.

  // Show Sign In when not authenticated
  if (!user) {
    return (
      <div>
        <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
          <Link prefetch={false} href="/auth/signin">
            Sign In
          </Link>
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

        <div className="flex flex-col gap-1 py-1">
          {user.role === "ADMIN" && (
            <DropdownMenuItem
              asChild
              className="focus:bg-secondary/50 focus:text-secondary-foreground"
            >
              <Link prefetch={false} href="/admin" className="flex items-center gap-2">
                <IconSettings aria-hidden="true" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            asChild
            className="focus:bg-secondary/50 focus:text-secondary-foreground"
          >
            <Link prefetch={false} href="/account" className="flex items-center gap-2">
              <IconUser aria-hidden="true" />
              <span>Account settings</span>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          asChild
          onSelect={async () => {
            await signOut({
              fetchOptions: {
                onSuccess: () => {
                  toast.success("Signed out successfully")
                  router.refresh()
                },
              },
            })
          }}
          className="focus:bg-secondary/50 focus:text-secondary-foreground text-destructive"
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
