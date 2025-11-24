import { auth } from "./auth";
import { db } from "./db";

/**
 * Get the current authenticated user with their approval and role status
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      approved: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

/**
 * Check if the current user is approved
 */
export async function isApproved() {
  const user = await getCurrentUser();
  return user?.approved === true;
}

/**
 * Get the current user's shopping cart (creates one if it doesn't exist)
 */
export async function getOrCreateCart() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  let cart = await db.shoppingCart.findUnique({
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

  if (!cart) {
    cart = await db.shoppingCart.create({
      data: {
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });
  }

  return cart;
}

/**
 * Calculate cart total
 */
export function calculateCartTotal(
  cartItems: Array<{
    product: { price: number };
    productVariant?: { price: number } | null;
    quantity: number;
  }>
) {
  return cartItems.reduce((total, item) => {
    const price = item.productVariant?.price ?? item.product.price;
    return total + price * item.quantity;
  }, 0);
}
