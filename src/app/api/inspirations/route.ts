import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/inspirations
 * Get all inspiration sets (collections)
 */
export async function GET() {
  try {
    const inspirationSets = await db.inspirationSet.findMany({
      include: {
        products: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(inspirationSets);
  } catch (error) {
    console.error("GET /api/inspirations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspiration sets" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inspirations
 * Create a new inspiration set (admin only)
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

    const {
      name,
      slug,
      subtitle,
      image,
      excerpt,
      inspirationText,
      productIds,
    } = body;

    if (!name || !slug || !subtitle || !image || !excerpt || !inspirationText) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const inspirationSet = await db.inspirationSet.create({
      data: {
        name,
        slug,
        subtitle,
        image,
        excerpt,
        inspirationText,
        ...(productIds && productIds.length > 0 && {
          products: {
            connect: productIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        products: true,
      },
    });

    return NextResponse.json(inspirationSet, { status: 201 });
  } catch (error) {
    console.error("POST /api/inspirations error:", error);
    return NextResponse.json(
      { error: "Failed to create inspiration set" },
      { status: 500 }
    );
  }
}
