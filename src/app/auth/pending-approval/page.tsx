import Link from "next/link"
import { Suspense } from "react"
import { ResendConfirmationEmail } from "@/components/auth/ResendConfirmationEmail"
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
          <InspirationCard key={inspiration.id} inspiration={inspiration} />
        ))}
      </div>
    </div>
  )
}

export default async function PendingApprovalPage({ searchParams }: PendingApprovalPageProps) {
  const params = await searchParams
  const email = params.email || ""

  return (
    <div className="flex flex-col bg-white">
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-5xl space-y-8">
          {/* Header Section */}
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold font-serif">Welcome to Peak Blooms!</h1>
            <p className="text-lg text-muted-foreground">Your account is pending approval</p>
          </div>

          {/* Main Content */}
          <div className="space-y-8 rounded-lg border border-border bg-secondary/5 p-8">
            {/* Email Confirmation */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">What&apos;s Next?</h2>
              <p className="text-muted-foreground">
                We&apos;ve sent a confirmation email to{" "}
                <strong className="text-foreground">{email}</strong>. Click the link in that email
                to verify your account.
              </p>
              <p className="text-sm text-muted-foreground">
                New accounts require approval from our team before you can place orders. This
                typically takes 24-48 hours.
              </p>
              <div className="pt-2">
                <ResendConfirmationEmail email={email} />
              </div>
            </div>

            {/* First-Time Discount Info */}
            <div className="space-y-3 border-t border-t-border pt-6">
              <h2 className="text-xl font-semibold">First-Time Customer Bonus</h2>
              <p className="text-muted-foreground">
                As a new Peak Blooms customer, you&apos;ll receive an exclusive discount on your
                first order once your account is approved. This is our way of welcoming you to our
                community!
              </p>
            </div>

            {/* Contact for Urgent Approval */}
            <div className="space-y-3 border-t border-t-border pt-6">
              <h2 className="text-xl font-semibold">Need Faster Approval?</h2>
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

          {/* Inspirations */}
          <Suspense fallback={<div>Loading inspirations...</div>}>
            <InspirationsList />
          </Suspense>

          {/* Return to Home */}
          <div className="flex justify-center pt-4">
            <Button asChild variant="outline">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
