"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyRequestPage() {
  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification link to your email address.
          </p>
        </div>

        <div className="space-y-4 rounded-lg bg-secondary/10 p-4">
          <h2 className="font-semibold">What&apos;s next?</h2>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Check your email inbox</li>
            <li>2. Click the sign-in link</li>
            <li>3. You&apos;ll be signed in to your Peak Blooms account</li>
          </ol>
        </div>

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p>The link expires in 24 hours.</p>
          <p>Didn&apos;t receive the email? Check your spam folder.</p>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/">Return to home</Link>
        </Button>
      </div>
    </div>
  );
}
