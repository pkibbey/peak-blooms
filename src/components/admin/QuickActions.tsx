import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function QuickActions() {
  return (
    <div className="rounded-lg border border-border p-6 bg-primary-foreground">
      <h4 className="heading-4 mb-2">Quick actions</h4>
      <p className="text-sm text-muted-foreground mb-4">Common admin tasks for fast access</p>

      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/admin/products/new">Add product</Link>} />

        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/orders?status=PENDING">View pending orders</Link>}
        />

        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/users">Review users</Link>}
        />

        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/collections/new">New collection</Link>}
        />
      </div>
    </div>
  )
}
