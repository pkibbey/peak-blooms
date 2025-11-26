import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/products
 * Get all products (with optional filtering)
 * Query params: collectionId, featured, color, stemLength, priceMin, priceMax
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");
    const featured = searchParams.get("featured");
    const color = searchParams.get("color");
    const stemLength = searchParams.get("stemLength");
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");

    const where: Record<string, unknown> = {};

    if (collectionId) {
      where.collectionId = collectionId;
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

    // Filter by variant properties (stemLength, price)
    const variantsFilter: Record<string, unknown> = {};
    
    if (stemLength !== null && stemLength !== "") {
      variantsFilter.stemLength = parseInt(stemLength as string, 10);
    }

    if (priceMin !== null || priceMax !== null) {
      const priceFilter: Record<string, unknown> = {};
      if (priceMin !== null && priceMin !== "") {
        priceFilter.gte = parseFloat(priceMin as string);
      }
      if (priceMax !== null && priceMax !== "") {
        priceFilter.lte = parseFloat(priceMax as string);
      }
      if (Object.keys(priceFilter).length > 0) {
        variantsFilter.price = priceFilter;
      }
    }

    if (Object.keys(variantsFilter).length > 0) {
      where.variants = {
        some: variantsFilter,
      };
    }

    const products = await db.product.findMany({
      where,
      include: {
        collection: true,
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
 * Create a new product with variants (admin only)
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

    const { name, slug, description, image, color, collectionId, featured, variants } = body;

    if (!name || !slug || !collectionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json(
        { error: "At least one variant is required" },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        image,
        color: color || null,
        collectionId,
        featured: featured === true,
        variants: {
          create: variants.map((v: { price: number; stemLength?: number | null; countPerBunch?: number | null }) => ({
            price: v.price,
            stemLength: v.stemLength ?? null,
            countPerBunch: v.countPerBunch ?? null,
          })),
        },
      },
      include: {
        collection: true,
        variants: true,
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
