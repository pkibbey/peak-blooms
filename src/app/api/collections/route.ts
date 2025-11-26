import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/collections
 * Get all product collections
 */
export async function GET() {
  try {
    const collections = await db.collection.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error("GET /api/collections error:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collections
 * Create a new collection (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { name, slug, image, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const collection = await db.collection.create({
      data: {
        name,
        slug,
        image,
        description,
      },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error("POST /api/collections error:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
