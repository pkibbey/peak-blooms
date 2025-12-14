"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPositioner,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconCheckCircle,
  IconClock,
  IconLogOut,
  IconSettings,
  IconUser,
} from "@/components/ui/icons"
import { authClient, signOut } from "@/lib/auth-client"

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
  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
      })
    } catch (error) {
      toast.error("Failed to sign in")
      console.error("[SignIn] Error during Google sign-in:", error)
    }
  }

  // Show Sign In when not authenticated
  if (!user) {
    return (
      <div>
        <Button
          onClick={handleGoogleSignIn}
          size="sm"
          variant="outline"
          className="hidden md:inline-flex"
        >
          Sign In
        </Button>
      </div>
    )
  }

  const label = user.name ?? user.email ?? "Account"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="sm" variant="outline" className="hidden md:inline-flex items-center gap-2">
            <IconUser aria-hidden="true" />
            <span className="truncate max-w-40">{label}</span>
          </Button>
        }
      />

      <DropdownMenuPositioner side="left" align="start">
        <DropdownMenuContent className="w-56">
          <div className="py-2 px-3 text-sm text-muted-foreground border-b">
            <div className="font-medium truncate">{user.name ?? user.email}</div>
            {user.email && <div className="text-xs opacity-80 truncate">{user.email}</div>}
            <div className="flex items-center gap-2 mt-2">
              {user.approved ? (
                <Badge variant="default">
                  <IconCheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <IconClock className="h-3 w-3 mr-1" />
                  Pending Approval
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 py-1">
            {user.role === "ADMIN" && (
              <DropdownMenuItem
                className="focus:bg-secondary/50 focus:text-secondary-foreground"
                nativeButton={false}
                render={
                  <Link prefetch={false} href="/admin" className="flex items-center gap-2">
                    <IconSettings aria-hidden="true" />
                    <span>Admin Dashboard</span>
                  </Link>
                }
              />
            )}

            <DropdownMenuItem
              className="focus:bg-secondary/50 focus:text-secondary-foreground"
              nativeButton={false}
              render={
                <Link prefetch={false} href="/account" className="flex items-center gap-2">
                  <IconUser aria-hidden="true" />
                  <span>Account settings</span>
                </Link>
              }
            />
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
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
            nativeButton={false}
            render={
              <div className="flex items-center gap-2">
                <IconLogOut aria-hidden="true" />
                <span>Sign out</span>
              </div>
            }
          />
        </DropdownMenuContent>
      </DropdownMenuPositioner>
    </DropdownMenu>
  )
}
