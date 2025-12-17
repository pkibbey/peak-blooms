/** Minimal user data for cart operations (from getCurrentUser) */
export interface SessionUser {
  id: string
  priceMultiplier: number
  email: string
  name?: string
  role?: string
  approved?: boolean
}
