import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/products
 * Get all products (with optional filtering)
 * Query params: categoryId, featured, color, stemLength, priceMin, priceMax
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const featured = searchParams.get("featured");
    const color = searchParams.get("color");
    const stemLength = searchParams.get("stemLength");
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");

    const where: Record<string, unknown> = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (color && color !== "") {
      where.color = {
        equals: color,
        mode: "insensitive",
      };
    }

    if (stemLength !== null) {
      where.stemLength = parseInt(stemLength as string, 10);
    }

    if (priceMin !== null || priceMax !== null) {
      where.price = {};
      if (priceMin !== null) {
        (where.price as Record<string, unknown>).gte = parseFloat(priceMin as string);
      }
      if (priceMax !== null) {
        (where.price as Record<string, unknown>).lte = parseFloat(priceMax as string);
      }
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Create a new product (admin only)
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

    const { name, slug, description, image, price, color, stemLength, countPerBunch, categoryId, featured } = body;

    if (!name || !slug || !price || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        image,
        price: parseFloat(price),
        color: color || null,
        stemLength: stemLength ? parseInt(stemLength) : null,
        countPerBunch: countPerBunch ? parseInt(countPerBunch) : null,
        categoryId,
        featured: featured === true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
