"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"

export default function SignOutButton() {
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await signOut({
          fetchOptions: {
            onSuccess: () => {
              toast.success("Signed out successfully")
            },
          },
        })
      }}
      className="text-destructive"
    >
      Sign Out
    </Button>
  )
}
