"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconMail } from "@/components/ui/icons";

interface ResendConfirmationEmailProps {
  email: string;
}

export function ResendConfirmationEmail({
  email,
}: ResendConfirmationEmailProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("Resend response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error("Resend error response:", data);
        throw new Error(data.error || "Failed to resend email");
      }

      const data = await response.json();
      console.log("Resend success response:", data);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error("Resend exception:", err);
      setError(
        err instanceof Error ? err.message : "Failed to resend email"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleResend}
        disabled={loading}
        variant="outline"
        className="inline-flex items-center gap-2"
      >
        <IconMail aria-hidden="true" />
        {loading ? "Sending..." : sent ? "Email Sent!" : "Resend Confirmation Email"}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {sent && (
        <p className="text-sm text-green-600">
          Confirmation email sent to {email}
        </p>
      )}
    </div>
  );
}
