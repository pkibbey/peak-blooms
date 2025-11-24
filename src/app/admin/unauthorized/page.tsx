import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to access the admin panel.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          If you believe this is an error, please contact the site administrator.
        </p>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/">Return to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
