"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
  approveUserAction,
  unapproveUserAction,
  updateUserPriceMultiplierAction,
} from "@/app/actions/admin-users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { UserForAdmin } from "@/lib/types/users"
import { formatDate, MAX_PRICE_MULTIPLIER, MIN_PRICE_MULTIPLIER } from "@/lib/utils"

interface UsersTableProps {
  users: UserForAdmin[]
  sort?: string | null
  order?: "asc" | "desc" | null
}

const headerUrl = "/admin/users"

export default function UsersTable({ users, sort, order }: UsersTableProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMultiplier, setEditMultiplier] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleMultiplierEdit = (userId: string, currentValue: number) => {
    setEditingId(userId)
    setEditMultiplier(currentValue.toString())
  }

  const handleMultiplierSave = async (userId: string) => {
    const numValue = parseFloat(editMultiplier)
    if (
      Number.isNaN(numValue) ||
      numValue < MIN_PRICE_MULTIPLIER ||
      numValue > MAX_PRICE_MULTIPLIER
    ) {
      toast.error(`Multiplier must be between ${MIN_PRICE_MULTIPLIER} and ${MAX_PRICE_MULTIPLIER}`)
      return
    }

    setLoadingId(userId)
    try {
      await updateUserPriceMultiplierAction({ userId, multiplier: numValue })
      toast.success("Price multiplier updated")
      setEditingId(null)
      router.refresh()
    } catch (error) {
      console.error("Error updating multiplier:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update price multiplier")
    } finally {
      setLoadingId(null)
    }
  }

  const handleApprove = async (userId: string) => {
    setLoadingId(userId)
    try {
      await approveUserAction({ userId })
      toast.success("User approved")
      router.refresh()
    } catch (error) {
      console.error("Error approving user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to approve user")
    } finally {
      setLoadingId(null)
    }
  }

  const handleUnapprove = async (userId: string) => {
    setLoadingId(userId)
    try {
      await unapproveUserAction({ userId })
      toast.success("User access revoked")
      router.refresh()
    } catch (error) {
      console.error("Error unapproving user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to unapprove user")
    } finally {
      setLoadingId(null)
    }
  }

  if (users.length === 0) {
    return <p className="text-muted-foreground">No users found.</p>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              label="Name"
              sortKey="name"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
            />
            <SortableTableHead
              label="Email"
              sortKey="email"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
              className="hidden md:table-cell"
            />
            <SortableTableHead
              label="Role"
              sortKey="role"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
            />
            <SortableTableHead
              label="Price ×"
              sortKey="priceMultiplier"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
            />
            <SortableTableHead
              label="Status"
              sortKey="approved"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
            />
            <SortableTableHead
              label="Joined"
              sortKey="createdAt"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
              className="hidden lg:table-cell"
            />
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              {/* Name */}
              <TableCell>
                <p className="font-medium">{user.name || "—"}</p>
              </TableCell>

              {/* Email */}
              <TableCell className="hidden md:table-cell text-muted-foreground">
                <p className="text-sm max-w-30 truncate">{user.email}</p>
              </TableCell>

              {/* Role */}
              <TableCell>
                <p className="text-sm">{user.role}</p>
              </TableCell>

              {/* Price Multiplier - Inline Editable */}
              <TableCell>
                {editingId === user.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min={MIN_PRICE_MULTIPLIER}
                      max={MAX_PRICE_MULTIPLIER}
                      value={editMultiplier}
                      onChange={(e) => setEditMultiplier(e.target.value)}
                      className="w-20 h-8"
                      disabled={loadingId === user.id}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMultiplierSave(user.id)}
                      disabled={loadingId === user.id}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                      disabled={loadingId === user.id}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMultiplierEdit(user.id, user.priceMultiplier)}
                    className="font-medium hover:underline text-primary cursor-pointer"
                  >
                    {user.priceMultiplier.toFixed(2)}
                  </button>
                )}
              </TableCell>

              {/* Approval Status */}
              <TableCell>
                <p className="text-sm">
                  {user.approved ? (
                    <span className="text-green-600 font-medium">Approved</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Pending</span>
                  )}
                </p>
              </TableCell>

              {/* Joined Date */}
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {user.approved ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnapprove(user.id)}
                      disabled={loadingId === user.id}
                    >
                      Revoke
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(user.id)}
                      disabled={loadingId === user.id}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
