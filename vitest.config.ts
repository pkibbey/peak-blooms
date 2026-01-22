import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    env: {
      // Mock DATABASE_URL for tests to prevent "not set" errors
      // The actual database is not used due to mocking in setup.ts
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    },
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Exclude test helpers and generated files from coverage
      exclude: ["node_modules/", "src/generated/", "test/", "src/test/"],
    },
  },
})
