import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/admin/users/[id]
 * Approve or reject a user (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { approved } = body;

    if (typeof approved !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const user = await db.user.update({
      where: { id },
      data: { approved },
      select: {
        id: true,
        email: true,
        name: true,
        approved: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
