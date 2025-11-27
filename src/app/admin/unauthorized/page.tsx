import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"

export default async function UnauthorizedPage() {
  const session = await auth()

  // If an authorized admin hits this page, redirect them to the dashboard
  if (session?.user?.role === "ADMIN") {
    redirect("/admin")
  }

  const isSignedIn = !!session?.user

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to access the admin panel.
          </p>
        </div>

        {isSignedIn ? (
          <>
            <p className="text-sm text-muted-foreground">
              You are signed in as{" "}
              <strong className="text-foreground">{session?.user.email}</strong>, but your account
              does not have admin access. If this is an error, please contact the site administrator
              to request access.
            </p>

            <div className="grid gap-3">
              <Button asChild variant="outline" className="w-full">
                <a href="mailto:hello@peakblooms.com?subject=Admin%20Access%20Request">
                  Request Admin Access
                </a>
              </Button>

              <Button asChild className="w-full">
                <Link href="/">Return to home</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Please sign in with an account that has access to the admin panel.
            </p>

            <div className="grid gap-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signin?callbackUrl=/admin">Sign in to Admin</Link>
              </Button>

              <Button asChild className="w-full">
                <Link href="/">Return to home</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
