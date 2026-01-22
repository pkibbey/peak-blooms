import { afterEach, vi } from "vitest"
import "@testing-library/jest-dom/vitest"

/**
 * Global test setup file for Vitest
 * Runs once before all tests
 *
 * These mocks prevent database connection attempts when importing modules
 */

// Mock Prisma adapter before any db module is imported
vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn(),
}))

// Mock pg Pool
vi.mock("pg", () => ({
  Pool: vi.fn(),
}))

// Mock the generated Prisma client
vi.mock("@/generated/client", () => ({
  PrismaClient: vi.fn(),
  MetricType: {
    ADMIN_QUERY: "ADMIN_QUERY",
    USER_QUERY: "USER_QUERY",
  },
  Role: {
    ADMIN: "ADMIN",
    CUSTOMER: "CUSTOMER",
    FLORIST: "FLORIST",
  },
}))

// Reset all mocks after each test to prevent test pollution
afterEach(() => {
  vi.clearAllMocks()
})
