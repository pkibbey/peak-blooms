"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

interface ProductFilters {
  filterDescription?: "has" | "missing"
  filterImages?: "has" | "missing"
  types?: string[]
}

interface BatchGenerateResult {
  success: boolean
  totalProcessed: number
  successCount: number
  failureCount: number
  details: Array<{
    productId: string
    productName: string
    success: boolean
    error?: string
  }>
}

export async function batchGenerateDescriptionsAction(
  filters?: ProductFilters
): Promise<BatchGenerateResult> {
  // Check authentication
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  // Build query string from filters
  const queryParams = new URLSearchParams()
  if (filters?.filterDescription) queryParams.set("filterDescription", filters.filterDescription)
  if (filters?.filterImages) queryParams.set("filterImages", filters.filterImages)
  if (filters?.types && filters.types.length > 0) queryParams.set("types", filters.types.join(","))

  // Call the API route - pass headers to maintain auth context
  const requestHeaders = await import("next/headers").then((m) => m.headers())
  const response = await fetch(
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/batch-generate-descriptions?${queryParams.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: requestHeaders.get("cookie") || "",
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `API returned ${response.status}`)
  }

  const result = await response.json()

  // Revalidate the products page to show updated descriptions
  revalidatePath("/admin/products")

  return result as BatchGenerateResult
}

interface BatchGenerateImagesResult {
  success: boolean
  totalProcessed: number
  successCount: number
  failureCount: number
  details: Array<{
    productId: string
    productName: string
    success: boolean
    error?: string
    images?: Array<{ imageUrl: string; prompt: string; styleTemplate?: string }>
  }>
}

export async function batchGenerateImagesAction(
  filters?: ProductFilters
): Promise<BatchGenerateImagesResult> {
  // Check authentication
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  // Build query string from filters
  const queryParams = new URLSearchParams()
  if (filters?.filterDescription) queryParams.set("filterDescription", filters.filterDescription)
  if (filters?.filterImages) queryParams.set("filterImages", filters.filterImages)
  if (filters?.types && filters.types.length > 0) queryParams.set("types", filters.types.join(","))

  // Call the API route - pass headers to maintain auth context
  const requestHeaders = await import("next/headers").then((m) => m.headers())
  const response = await fetch(
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/batch-generate-images?${queryParams.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: requestHeaders.get("cookie") || "",
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `API returned ${response.status}`)
  }

  const result = await response.json()

  // Revalidate the products page to keep counts current. Final revalidation after uploads happens in the client component.
  revalidatePath("/admin/products")

  return result as BatchGenerateImagesResult
}
