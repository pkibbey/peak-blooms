"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SignInPage() {
  const searchParams = useSearchParams();
  // If a caller passed a callbackUrl (e.g. /admin) keep it; otherwise send
  // users through a short server-side redirect handler which will route
  // admins to /admin and everyone else to home. This ensures admin users
  // who sign in from the generic flow are taken to the dashboard.
  const callbackUrl =
    searchParams.get("callbackUrl") || `/auth/redirect?next=${encodeURIComponent(
      "/"
    )}`;
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (result?.ok) {
        setSubmitted(true);
      } else {
        console.error("Sign in failed:", result?.error);
      }
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a sign-in link to <strong>{email}</strong>
            </p>
          </div>
          <div className="space-y-4 text-center text-sm text-muted-foreground">
            <p>Click the link in the email to sign in to your account.</p>
            <p>The link expires in 24 hours.</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Sign in to Peak Blooms</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to sign in or create an account
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error === "Callback" && "Invalid sign-in link or link has expired."}
            {error === "EmailSignInError" && "Failed to send sign-in email."}
            {error && !["Callback", "EmailSignInError"].includes(error) && error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending link..." : "Sign in with Email"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
