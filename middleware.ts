import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Server-side admin gate (secure):
 * - Calls internal `/api/auth/validate` which uses the server `getSession()`.
 * - Redirects unauthenticated users to sign-in and signed-in non-admins to /admin-unauthorized.
 *
 * This avoids trusting client-provided data for authorization and keeps the
 * admin layout static (no `headers()` during rendering).
 */
export async function middleware(request: NextRequest) {
  const validateUrl = new URL("/api/auth/validate", request.url)

  try {
    const res = await fetch(validateUrl.toString(), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      // avoid stale cached responses
      cache: "no-store",
    })

    if (res.ok) {
      const body = await res.json()
      const role = body?.user?.role
      if (role === "ADMIN") return NextResponse.next()

      // Signed-in but not an admin
      const unauthorizedUrl = new URL("/admin-unauthorized", request.url)
      return NextResponse.redirect(unauthorizedUrl)
    }
  } catch (err) {
    // Fall through to redirect to signin on unexpected errors
    console.error("middleware /admin auth check failed:", err)
  }

  const signInUrl = new URL("/auth/signin", request.url)
  signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: ["/admin/:path*"],
}
