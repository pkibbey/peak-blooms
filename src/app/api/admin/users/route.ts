import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        approved: true,
        createdAt: true,
      },
      orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
