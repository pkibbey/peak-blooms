"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MAX_PRICE_MULTIPLIER, MIN_PRICE_MULTIPLIER } from "@/lib/utils"

interface User {
  id: string
  email: string | null
  name: string | null
  approved: boolean
  priceMultiplier: number
  createdAt: string
}

interface PendingUserCardProps {
  user: User
}

export default function PendingUserCard({ user }: PendingUserCardProps) {
  const router = useRouter()
  const [approving, setApproving] = useState(false)
  const [multiplier, setMultiplier] = useState(user.priceMultiplier.toString())

  const handleApprove = async () => {
    const numValue = Number.parseFloat(multiplier)
    if (Number.isNaN(numValue) || numValue < MIN_PRICE_MULTIPLIER || numValue > MAX_PRICE_MULTIPLIER) {
      toast.error(`Multiplier must be between ${MIN_PRICE_MULTIPLIER} and ${MAX_PRICE_MULTIPLIER}`)
      return
    }

    setApproving(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, priceMultiplier: numValue }),
      })

      if (response.ok) {
        toast.success("User approved")
        router.refresh()
      } else {
        toast.error("Failed to approve user")
      }
    } catch (error) {
      console.error("Error approving user:", error)
      toast.error("Failed to approve user")
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{user.name || "No name"}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground">
          Signed up: {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="ml-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor={`multiplier-${user.id}`} className="text-sm text-muted-foreground whitespace-nowrap">
            Price ×
          </label>
          <Input
            id={`multiplier-${user.id}`}
            type="number"
            step="0.01"
            min={MIN_PRICE_MULTIPLIER}
            max={MAX_PRICE_MULTIPLIER}
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            className="w-20 h-8"
          />
        </div>
        <Button size="sm" onClick={handleApprove} disabled={approving}>
          Approve
        </Button>
      </div>
    </div>
  )
}
