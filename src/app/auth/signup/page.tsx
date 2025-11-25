"use client";

import { FormEvent, useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/");
    }
  }, [status, session, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
      });

      if (result?.ok) {
        // Redirect to pending approval page
        router.push(`/auth/pending-approval?email=${encodeURIComponent(email)}`);
      } else {
        setError("Failed to send sign-up email. Please try again.");
        console.error("Sign up failed:", result?.error);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Error signing up:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Create Your Account</h1>
          <p className="text-sm text-muted-foreground">
            Sign up to explore Peak Blooms and get exclusive first-time customer discounts
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
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
            {loading ? "Sending sign-up link..." : "Sign Up with Email"}
          </Button>
        </form>

        <div className="space-y-3 text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
