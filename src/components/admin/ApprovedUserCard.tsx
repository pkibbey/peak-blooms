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

interface ApprovedUserCardProps {
  user: User
}

export default function ApprovedUserCard({ user }: ApprovedUserCardProps) {
  const router = useRouter()
  const [unapproving, setUnapproving] = useState(false)
  const [savingMultiplier, setSavingMultiplier] = useState(false)
  const [multiplier, setMultiplier] = useState(user.priceMultiplier.toString())

  const handleUnapprove = async () => {
    setUnapproving(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false }),
      })

      if (response.ok) {
        toast.success("User access revoked")
        router.refresh()
      } else {
        toast.error("Failed to unapprove user")
      }
    } catch (error) {
      console.error("Error unapproving user:", error)
      toast.error("Failed to unapprove user")
    } finally {
      setUnapproving(false)
    }
  }

  const handleMultiplierSave = async () => {
    const numValue = Number.parseFloat(multiplier)
    if (
      Number.isNaN(numValue) ||
      numValue < MIN_PRICE_MULTIPLIER ||
      numValue > MAX_PRICE_MULTIPLIER
    ) {
      toast.error(`Multiplier must be between ${MIN_PRICE_MULTIPLIER} and ${MAX_PRICE_MULTIPLIER}`)
      return
    }

    setSavingMultiplier(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceMultiplier: numValue }),
      })

      if (response.ok) {
        toast.success("Price multiplier updated")
        router.refresh()
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to update price multiplier")
      }
    } catch (error) {
      console.error("Error updating multiplier:", error)
      toast.error("Failed to update price multiplier")
    } finally {
      setSavingMultiplier(false)
    }
  }

  const multiplierChanged = Number.parseFloat(multiplier) !== user.priceMultiplier

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{user.name || "No name"}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground">
          Approved: {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="ml-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor={`multiplier-${user.id}`}
            className="text-sm text-muted-foreground whitespace-nowrap"
          >
            Price Multiplier ×
          </label>
          <Input
            id={`multiplier-${user.id}`}
            type="number"
            step="0.01"
            min={MIN_PRICE_MULTIPLIER}
            max={MAX_PRICE_MULTIPLIER}
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            className="w-30 h-8"
          />
          {multiplierChanged && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMultiplierSave}
              disabled={savingMultiplier}
            >
              Save
            </Button>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive hover:text-white"
          onClick={handleUnapprove}
          disabled={unapproving}
        >
          Reject
        </Button>
      </div>
    </div>
  )
}
