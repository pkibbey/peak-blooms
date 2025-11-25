"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  approved: boolean;
  createdAt: string;
}

interface PendingUserCardProps {
  user: User;
}

export default function PendingUserCard({ user }: PendingUserCardProps) {
  const router = useRouter();
  const [approving, setApproving] = useState<string | null>(null);

  const handleApprove = async () => {
    setApproving(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        // Refresh to update the user list
        router.refresh();
      } else {
        console.error("Failed to approve user");
      }
    } catch (error) {
      console.error("Error approving user:", error);
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{user.name || "No name"}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground">
          Signed up: {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="ml-4 flex gap-2">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={approving === user.id}
        >
          Approve
        </Button>
      </div>
    </div>
  );
}
