import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isApproved } from "@/lib/auth-utils";
import { NextResponse } from "next/server";

/**
 * Generate the next order number in sequence (PB-00001, PB-00002, etc.)
 */
async function generateOrderNumber(): Promise<string> {
  const lastOrder = await db.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  let nextNumber = 1;
  if (lastOrder?.orderNumber) {
    const match = lastOrder.orderNumber.match(/PB-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `PB-${nextNumber.toString().padStart(5, "0")}`;
}

/**
 * GET /api/orders
 * Get current user's orders (approved users only)
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is approved
    const approved = await isApproved();
    if (!approved) {
      return NextResponse.json(
        { error: "Your account is not approved for purchases" },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const orders = await db.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Create a new order from shopping cart (approved users only)
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is approved
    const approved = await isApproved();
    if (!approved) {
      return NextResponse.json(
        { error: "Your account is not approved for purchases" },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      shippingAddressId,
      shippingAddress,
      saveShippingAddress,
      billingAddress,
      email,
      phone,
      notes,
    } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Get user's cart
    const cart = await db.shoppingCart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Calculate total using variant pricing (required)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = cart.items.reduce((sum: number, item: any) => {
      const price = item.productVariant?.price ?? 0;
      return sum + price * item.quantity;
    }, 0);

    // Handle shipping address
    let finalShippingAddressId: string;

    if (shippingAddressId) {
      // Using existing address - verify it belongs to user
      const existingAddress = await db.address.findFirst({
        where: {
          id: shippingAddressId,
          userId: user.id,
        },
      });

      if (!existingAddress) {
        return NextResponse.json(
          { error: "Invalid shipping address" },
          { status: 400 }
        );
      }

      finalShippingAddressId = shippingAddressId;
    } else if (shippingAddress) {
      // Creating new address
      const newAddress = await db.address.create({
        data: {
          userId: saveShippingAddress ? user.id : null,
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          company: shippingAddress.company || null,
          street1: shippingAddress.street1,
          street2: shippingAddress.street2 || null,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip: shippingAddress.zip,
          country: shippingAddress.country || "US",
        },
      });

      finalShippingAddressId = newAddress.id;
    } else {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // Handle billing address (optional)
    let finalBillingAddressId: string | null = null;

    if (billingAddress) {
      const newBillingAddress = await db.address.create({
        data: {
          userId: null, // Billing addresses are not saved to user profile
          firstName: billingAddress.firstName,
          lastName: billingAddress.lastName,
          company: billingAddress.company || null,
          street1: billingAddress.street1,
          street2: billingAddress.street2 || null,
          city: billingAddress.city,
          state: billingAddress.state,
          zip: billingAddress.zip,
          country: billingAddress.country || "US",
        },
      });

      finalBillingAddressId = newBillingAddress.id;
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order with items
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: user.id,
        total,
        status: "PENDING",
        email,
        phone: phone || null,
        notes: notes || null,
        shippingAddressId: finalShippingAddressId,
        billingAddressId: finalBillingAddressId,
        items: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create: cart.items.map((item: any) => ({
            productId: item.productId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            price: item.productVariant?.price ?? 0,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    // Clear the cart
    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
