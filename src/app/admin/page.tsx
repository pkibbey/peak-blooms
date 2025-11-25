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

        {/* Users section */}
        <div className="mb-6 rounded-lg border border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">User Management</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Review and approve pending user accounts
              </p>
            </div>
            <div className="shrink-0">
              <Button asChild className="mt-2">
                <Link href="/admin/users">Manage Users</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Content management section */}
        <div className="rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Content Management</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage products, collections, and inspirations
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-md border border-border p-4">
              <h3 className="text-lg font-semibold">Shop</h3>
              <p className="mt-1 text-sm text-muted-foreground">Add, edit, and manage product listings</p>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild size="sm">
                  <Link href="/admin/products">Manage Products</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-md border border-border p-4">
              <h3 className="text-lg font-semibold">Collections</h3>
              <p className="mt-1 text-sm text-muted-foreground">Organize products into collections</p>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild size="sm">
                  <Link href="/admin/collections">Manage Collections</Link>
                </Button>
              </div>
            </div>


            <div className="rounded-md border border-border p-4">
              <h3 className="text-lg font-semibold">Inspirations</h3>
              <p className="mt-1 text-sm text-muted-foreground">Curate inspiration sets</p>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild size="sm">
                  <Link href="/admin/inspirations">Manage Inspirations</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
