import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/users/addresses/[id] - Get a specific address
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const address = await db.address.findFirst({
      where: { id, userId: user.id },
    })

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    return NextResponse.json(address)
  } catch (error) {
    console.error("Error fetching address:", error)
    return NextResponse.json({ error: "Failed to fetch address" }, { status: 500 })
  }
}

// PATCH /api/users/addresses/[id] - Update an address
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify address belongs to user
    const existingAddress = await db.address.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    const body = await request.json()
    const { firstName, lastName, company, street1, street2, city, state, zip, country, isDefault } =
      body

    // If this address is being set as default, clear other defaults first
    if (isDefault === true) {
      await db.address.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const address = await db.address.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(company !== undefined && { company }),
        ...(street1 !== undefined && { street1 }),
        ...(street2 !== undefined && { street2 }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zip !== undefined && { zip }),
        ...(country !== undefined && { country }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    return NextResponse.json(address)
  } catch (error) {
    console.error("Error updating address:", error)
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
  }
}

// DELETE /api/users/addresses/[id] - Delete an address
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify address belongs to user
    const existingAddress = await db.address.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    // Check if address is used in any orders
    const ordersUsingAddress = await db.order.findFirst({
      where: { shippingAddressId: id },
    })

    if (ordersUsingAddress) {
      // Instead of deleting, just unlink from user (keep for order history)
      await db.address.update({
        where: { id },
        data: { userId: null, isDefault: false },
      })
      return NextResponse.json({
        message: "Address unlinked from account (preserved for order history)",
      })
    }

    // If not used in orders, delete it
    await db.address.delete({
      where: { id },
    })

    // After deletion, check if the deleted address was the default
    if (existingAddress.isDefault) {
      // Get the count of remaining addresses for this user
      const remainingAddresses = await db.address.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      })

      // If there's exactly one remaining address, make it the default
      if (remainingAddresses.length === 1) {
        await db.address.update({
          where: { id: remainingAddresses[0].id },
          data: { isDefault: true },
        })
      }
    }

    return NextResponse.json({ message: "Address deleted" })
  } catch (error) {
    console.error("Error deleting address:", error)
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
  }
}
