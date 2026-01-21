"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"

type Props = {
  onDone?: () => void
}

export default function SignOutButton({ onDone }: Props) {
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await signOut({
          fetchOptions: {
            onSuccess: () => {
              toast.success("Signed out successfully")
              onDone?.()
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
