import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const session = await auth();

  // Verify admin role
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized");
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage Peak Blooms content and user approvals
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold">User Management</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Review and approve pending user accounts
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </div>

          <div className="rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold">Content Management</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage products, categories, and collections (coming soon)
            </p>
            <Button disabled className="mt-4">
              Coming Soon
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
