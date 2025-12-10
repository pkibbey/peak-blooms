import Link from "next/link"
import { Suspense } from "react"
import { InspirationCard } from "@/components/site/InspirationCard"
import { Button } from "@/components/ui/button"
import { IconMail } from "@/components/ui/icons"
import { db } from "@/lib/db"

async function InspirationsList() {
  const inspirations = await db.inspiration.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  })

  if (!inspirations || inspirations.length === 0) {
    return null
  }

  return (
    <div className="mt-12 pt-8 border-t border-t-border">
      <h2 className="text-2xl font-bold font-serif mb-8">Browse Our Inspirations While You Wait</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {inspirations.map((inspiration) => (
          <InspirationCard key={inspiration.id} inspiration={inspiration} />
        ))}
      </div>
    </div>
  )
}

export default async function PendingApprovalPage() {
  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-2 text-center">
          <h2 className="heading-2">Your Account is Pending Approval</h2>
          <p className="text-lg text-muted-foreground">
            We&apos;re verifying your information and will notify you once your account is approved.
          </p>
        </div>

        {/* Contact for Urgent Approval */}
        <div className="space-y-3 border-t border-t-border pt-6">
          <h3 className="heading-3">Need Faster Approval?</h3>
          <p className="text-muted-foreground">
            If you need your account approved urgently, please reach out to our team:
          </p>
          <div className="space-y-2">
            <Button asChild variant="outline">
              <a
                href="mailto:hello@peakblooms.com?subject=Account%20Approval%20Request"
                className="inline-flex items-center gap-2"
              >
                <IconMail aria-hidden="true" />
                Email Support
              </a>
            </Button>
            <div className="text-sm text-muted-foreground">
              Or call us at{" "}
              <a href="tel:+16199321139" className="font-medium hover:underline">
                (619) 932-1139
              </a>
            </div>
          </div>
        </div>

        <Suspense fallback={null}>
          <InspirationsList />
        </Suspense>

        <div className="text-center">
          <Button asChild variant="outline">
            <Link prefetch={false} href="/">
              Return to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
