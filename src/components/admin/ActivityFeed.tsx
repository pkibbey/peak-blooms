import Link from "next/link"

interface FeedItem {
  id: string
  type: string
  title: string
  subtitle?: string
  createdAt: string
  href?: string
}

interface ActivityFeedProps {
  items: FeedItem[]
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6">
        <h3 className="heading-3 mb-3">Recent activity</h3>
        <p className="text-sm text-muted-foreground">No recent activity yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border p-6">
      <h3 className="heading-3 mb-3">Recent activity</h3>
      <div className="divide-y">
        {items.map((it) => (
          <div key={it.id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-primary">{it.title}</div>
                {it.subtitle && (
                  <div className="mt-1 text-xs text-muted-foreground">{it.subtitle}</div>
                )}
              </div>

              <div className="text-xs text-muted-foreground text-right">
                <div>{new Date(it.createdAt).toLocaleString()}</div>
                {it.href && (
                  <div className="mt-1">
                    <Link
                      prefetch={false}
                      href={it.href}
                      className="text-primary text-xs hover:underline"
                    >
                      View
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
