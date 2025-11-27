import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  const getErrorMessage = (error: string | undefined) => {
    switch (error) {
      case "Callback":
        return "Invalid sign-in link or link has expired. Please try signing in again."
      case "EmailSignInError":
        return "Failed to send sign-in email. Please try again."
      case "EmailCreateAccount":
        return "Could not create account. Please try again."
      default:
        return "An error occurred during sign-in. Please try again."
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Sign in error</h1>
          <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
        </div>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/signin">Try signing in again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return to home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
