"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  email: string | null
  name: string | null
  approved: boolean
  createdAt: string
}

interface ApprovedUserCardProps {
  user: User
}

export default function ApprovedUserCard({ user }: ApprovedUserCardProps) {
  const router = useRouter()
  const [unapproving, setUnapproving] = useState(false)

  const handleUnapprove = async () => {
    setUnapproving(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false }),
      })

      if (response.ok) {
        // Refresh to update the user list
        router.refresh()
      } else {
        console.error("Failed to unapprove user")
      }
    } catch (error) {
      console.error("Error unapproving user:", error)
    } finally {
      setUnapproving(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{user.name || "No name"}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground">
          Approved: {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="ml-4">
        <Button
          size="sm"
          variant="outline-destructive"
          onClick={handleUnapprove}
          disabled={unapproving}
        >
          Reject
        </Button>
      </div>
    </div>
  )
}
