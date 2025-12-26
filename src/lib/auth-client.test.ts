import { describe, expect, it, vi } from "vitest"

// Mock better-auth/react
vi.mock("better-auth/react", () => ({
  createAuthClient: vi.fn(() => ({
    useSession: vi.fn(),
    signOut: vi.fn(),
  })),
}))

import { authClient, signOut, useSession } from "./auth-client"

describe("Auth Client", () => {
  it("should export authClient and hooks", () => {
    expect(authClient).toBeDefined()
    expect(useSession).toBeDefined()
    expect(signOut).toBeDefined()
  })
})
