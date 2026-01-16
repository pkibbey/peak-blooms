/**
 * Global type extensions for Peak Blooms
 * Extends globalThis with application-specific properties
 */

import type { PrismaClient } from "@/generated/client"

declare global {
  var prisma: PrismaClient | undefined
}
