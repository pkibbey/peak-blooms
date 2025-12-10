import Link from "next/link"
import { Suspense } from "react"
import { InspirationCard } from "@/components/site/InspirationCard"
import { Button } from "@/components/ui/button"
import { IconMail } from "@/components/ui/icons"
import { db } from "@/lib/db"

interface PendingApprovalPageProps {
  searchParams: Promise<{ email?: string }>
}

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inspirations.map((inspiration) => (
          <InspirationCard
            key={inspiration.id}
            inspiration={inspiration}
          />
        ))}
      </div>
    </div>
  )
}

export default async function PendingApprovalPage({ searchParams }: PendingApprovalPageProps) {
  const params = await searchParams
  const email = params?.email

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Your Account is Pending Approval</h1>
          <p className="text-lg text-muted-foreground">
            We&apos;re verifying your information and will notify you once your account is approved.
          </p>
        </div>

        <div className="space-y-6 rounded-lg border border-border bg-secondary/50 p-6">
          <div className="space-y-3">
            <h2 className="heading-2">What&apos;s Next?</h2>
            <p className="text-muted-foreground">
              Your Peak Blooms account has been created successfully. New accounts require approval
              from our team before you can place orders. This typically takes 24-48 hours.
            </p>
            {email && (
              <p className="text-sm text-muted-foreground">
                We&apos;ll send a confirmation email to <strong className="text-foreground">{email}</strong> once
                your account is approved.
              </p>
            )}
          </div>

          {/* First-Time Discount Info */}
          <div className="space-y-3 border-t border-t-border pt-6">
            <h2 className="heading-2">First-Time Customer Bonus</h2>
            <p className="text-muted-foreground">
              As a new Peak Blooms customer, you&apos;ll receive an exclusive discount on your first
              order once your account is approved. This is our way of welcoming you to our community!
            </p>
          </div>

          {/* Contact for Urgent Approval */}
          <div className="space-y-3 border-t border-t-border pt-6">
            <h2 className="heading-2">Need Faster Approval?</h2>
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
        </div>

        <Suspense fallback={null}>
          <InspirationsList />
        </Suspense>

        <div className="text-center">
          <Button asChild variant="outline">
            <Link href="/">Return to home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
