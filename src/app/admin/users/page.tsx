"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  approved: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  // Check authorization
  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "ADMIN")) {
      router.push("/admin/unauthorized");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "ADMIN") {
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users");
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          console.error("Failed to fetch users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [status, session]);

  const handleApprove = async (userId: string) => {
    setApproving(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, approved: true } : user
          )
        );
      } else {
        console.error("Failed to approve user");
      }
    } catch (error) {
      console.error("Error approving user:", error);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (userId: string) => {
    setApproving(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: false }),
      });

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user.id !== userId)
        );
      } else {
        console.error("Failed to reject user");
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
    } finally {
      setApproving(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter((u) => !u.approved);
  const approvedUsers = users.filter((u) => u.approved);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="mt-2 text-muted-foreground">
            Review and approve new user accounts
          </p>
        </div>

        {/* Pending Approvals */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">
            Pending Approval ({pendingUsers.length})
          </h2>
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending user approvals
            </p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{user.name || "No name"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Signed up:{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(user.id)}
                      disabled={approving === user.id}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(user.id)}
                      disabled={approving === user.id}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Users */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Approved Users ({approvedUsers.length})
          </h2>
          {approvedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No approved users yet
            </p>
          ) : (
            <div className="space-y-3">
              {approvedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{user.name || "No name"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Approved:{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
