"use client"

import { toast } from "sonner"
import { signOut } from "@/lib/auth-client"
import { Button } from "../ui/button"

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
