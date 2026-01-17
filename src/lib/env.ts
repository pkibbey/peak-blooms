/**
 * Environment Variable Configuration
 *
 * Validates and provides type-safe access to environment variables.
 * Runs on application startup to catch missing or invalid configuration early.
 */

import { z } from "zod"

/**
 * Environment variable schema with validation
 * Update this schema whenever adding new environment variables
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Authentication
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // Blob storage
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Logging (optional)
  DAL_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Feature flags (optional)
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .enum(["true", "false"])
    .default("false")
    .transform((x) => x === "true"),
})

/**
 * Parsed and validated environment variables
 * Access via ENV.NODE_ENV, ENV.GOOGLE_CLIENT_ID, etc.
 *
 * Throws on startup if validation fails
 */
export const ENV = envSchema.parse(process.env)

/**
 * Type of validated environment variables
 * Use for type-safe env variable access
 */
export type Env = z.infer<typeof envSchema>

/**
 * Safely get an optional environment variable with a default
 * Use for optional configuration that has sensible defaults
 */
export function getEnv<T extends keyof Env>(key: T, defaultValue?: Env[T]): Env[T] {
  const value = ENV[key]
  if (value === undefined && defaultValue !== undefined) {
    return defaultValue
  }
  return value as Env[T]
}

/**
 * Check if running in production
 */
export const isProduction = ENV.NODE_ENV === "production"

/**
 * Check if running in development
 */
export const isDevelopment = ENV.NODE_ENV === "development"

/**
 * Check if running in test
 */
export const isTest = ENV.NODE_ENV === "test"
