import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

interface RedirectPageProps {
  searchParams?: { next?: string };
}

export default async function AuthRedirectPage({ searchParams }: RedirectPageProps) {
  const session = await auth();

  // If a signed-in admin with approved status reaches this route, send them to the admin dashboard.
  if (session?.user?.role === "ADMIN" && session?.user?.approved) {
    return redirect("/admin");
  }

  // Otherwise send them to the next param or home.
  const next = searchParams?.next || "/";
  return redirect(next);
}
