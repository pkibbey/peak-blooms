import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the route is an admin route
  if (pathname.startsWith("/admin")) {
    // Check for NextAuth session token
    const sessionToken = request.cookies.get("next-auth.session-token")?.value ||
                         request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!sessionToken) {
      // No session, redirect to unauthorized
      return NextResponse.redirect(new URL("/admin/unauthorized", request.url));
    }
    // Note: Role verification happens server-side in the admin pages/API routes
    // If a user without ADMIN role tries to access, they'll be redirected
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
