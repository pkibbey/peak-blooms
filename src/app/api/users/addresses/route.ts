import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"

// GET /api/users/addresses - Get all addresses for the current user
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const addresses = await db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error("Error fetching addresses:", error)
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 })
  }
}

// POST /api/users/addresses - Create a new address
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      company,
      street1,
      street2,
      city,
      state,
      zip,
      country = "US",
      email,
      phone,
      isDefault = false,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !street1 || !city || !state || !zip || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // If this address is being set as default, clear other defaults first
    if (isDefault) {
      await db.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await db.address.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        company,
        street1,
        street2,
        city,
        state,
        zip,
        country,
        email,
        phone,
        isDefault,
      },
    })

    return NextResponse.json(address, { status: 201 })
  } catch (error) {
    console.error("Error creating address:", error)
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 })
  }
}
