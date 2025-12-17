import { afterEach, vi } from "vitest"
import "@testing-library/jest-dom/vitest"

/**
 * Global test setup file for Vitest
 * Runs once before all tests
 */

// Reset all mocks after each test to prevent test pollution
afterEach(() => {
  vi.clearAllMocks()
})
