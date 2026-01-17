# Error Handling & Type Safety Guide

This guide covers how to implement type-safe error handling in Peak Blooms using the new utilities.

## Overview

The goal is to move away from throwing raw `Error` objects to returning structured `AppResult<T>` responses from all server actions.

## Key Types

### AppResult<T>
```typescript
export type AppResult<T> = 
  | { success: true; data: T }
  | AppError
```

All server actions should return this discriminated union type for type-safe error handling in components.

### AppError
```typescript
export type AppError = {
  success: false
  error: string
  code?: ErrorCode
  details?: Record<string, string | string[]>
}

type ErrorCode = 
  | "UNAUTHORIZED" 
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "SERVER_ERROR"
```

## Error Handling Utilities

Located in `src/lib/error-utils.ts`

### Type Guards

```typescript
import { isZodError, isErrorObject } from "@/lib/error-utils"

try {
  const result = await someAsyncOperation()
} catch (error) {
  if (isZodError(error)) {
    // Handle validation errors
  } else if (isErrorObject(error)) {
    // Handle Error objects
  }
}
```

### Extract Error Messages

```typescript
import { getErrorMessage } from "@/lib/error-utils"

try {
  await operation()
} catch (error) {
  const message = getErrorMessage(error) // Always returns string
  console.log(message)
}
```

### Convert to AppError

```typescript
import { toAppError } from "@/lib/error-utils"

try {
  const result = userSchema.parse(data)
} catch (error) {
  const appError = toAppError(error, "Invalid user data")
  return { success: false, ...appError }
}
```

## Server Action Patterns

### Pattern 1: Simple Success/Error with AppResult

```typescript
import { toAppError } from "@/lib/error-utils"
import { createUserSchema } from "@/lib/validations/users"
import type { AppResult, AdminUserResponse } from "@/lib/query-types"

export async function createUserAction(
  input: unknown
): Promise<AppResult<AdminUserResponse>> {
  try {
    // 1. Validate input
    const validated = createUserSchema.parse(input)
    
    // 2. Check authorization
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Admin access required",
        code: "UNAUTHORIZED",
      }
    }
    
    // 3. Perform action
    const user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name,
      },
    })
    
    // 4. Return success
    revalidatePath("/admin/users")
    return { success: true, data: user }
    
  } catch (error) {
    // 5. Handle errors - toAppError handles Zod and other types
    return toAppError(error, "Failed to create user")
  }
}
```

### Pattern 2: Throwing Errors (Legacy - Being Phased Out)

```typescript
// ❌ Old pattern - being deprecated
export async function oldAction(input: unknown) {
  try {
    const validated = schema.parse(input)
    return await db.operation()
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed")
  }
}
```

### Pattern 3: Component Error Handling

```typescript
"use client"

import { createUserAction } from "@/app/actions/admin-users"
import { toast } from "sonner"

async function handleCreateUser(data: FormData) {
  const result = await createUserAction(data)
  
  if (!result.success) {
    // Discriminated union - TypeScript knows these fields exist
    if (result.code === "VALIDATION_ERROR") {
      // Show field-level validation errors from Zod
      if (result.details?.email) {
        form.setError("email", { message: result.details.email[0] })
      }
    } else if (result.code === "UNAUTHORIZED") {
      router.push("/auth/signin")
    } else {
      toast.error(result.error)
    }
  } else {
    // result.success is true - data is available
    toast.success(`User ${result.data.email} created`)
    router.refresh()
  }
}
```

## Environment Variables

Located in `src/lib/env.ts`

### Type-Safe Access

```typescript
import { ENV, isProduction, isDevelopment } from "@/lib/env"

// All env vars are validated on startup
console.log(ENV.GOOGLE_CLIENT_ID)    // string
console.log(ENV.DATABASE_URL)        // string URL
console.log(ENV.NODE_ENV)            // "development" | "production" | "test"
console.log(ENV.DAL_LOG_LEVEL)       // "debug" | "info" | "warn" | "error"

// Convenience helpers
if (isProduction) {
  // Production-only code
}

if (isDevelopment) {
  // Development-only code
}
```

### Adding New Environment Variables

1. Add to the schema in `src/lib/env.ts`:
```typescript
const envSchema = z.object({
  // ... existing vars
  MY_NEW_VAR: z.string().min(1, "MY_NEW_VAR is required"),
})
```

2. Use it with validation:
```typescript
import { ENV } from "@/lib/env"

const myVar = ENV.MY_NEW_VAR  // Type-safe, validated at startup
```

## Test Helpers

Located in `src/test/session-user-helpers.ts`

### Create Mock Users

```typescript
import { 
  mockSessionUser, 
  mockAdminUser,
  mockUserWithRole 
} from "@/test/session-user-helpers"
import { Role } from "@/generated/enums"

// Basic customer mock
const user = mockSessionUser()

// Admin mock
const admin = mockAdminUser()

// Custom role
const subscriber = mockUserWithRole(Role.SUBSCRIBER)

// Override specific fields
const user2 = mockSessionUser({ 
  email: "custom@example.com",
  priceMultiplier: 1.5 
})
```

### In Tests

```typescript
import { vi } from "vitest"
import { getCurrentUser } from "@/lib/current-user"
import { mockAdminUser } from "@/test/session-user-helpers"

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(),
}))

describe("Admin Action", () => {
  it("should require admin role", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(
      mockAdminUser()  // Automatically has ADMIN role
    )
    
    const result = await adminAction(data)
    expect(result).toContainEqual(expect.anything())
  })
  
  it("should reject non-admin users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(
      mockSessionUser()  // CUSTOMER role
    )
    
    const result = await adminAction(data)
    expect(result.success).toBe(false)
  })
})
```

## Migration Checklist

When converting an existing server action to `AppResult` pattern:

- [ ] Import `toAppError` from `@/lib/error-utils`
- [ ] Import `AppResult` from `@/lib/query-types`
- [ ] Change return type from `Promise<T>` to `Promise<AppResult<T>>`
- [ ] Wrap implementation in try/catch
- [ ] Use `toAppError` in catch block
- [ ] Return `{ success: true, data }` on success
- [ ] Return `{ success: false, error: ... }` on known errors
- [ ] Update related test files to expect `AppResult`
- [ ] Update components using the action to handle `result.success`
- [ ] Update TypeScript validation script if needed

## Best Practices

1. **Validate Early**: Parse and validate input immediately
2. **Fail Fast**: Check authorization before doing work
3. **Be Specific**: Use appropriate error codes for different failure modes
4. **Log Sensibly**: Log errors for debugging but don't expose internal details to users
5. **Test Error Paths**: Write tests for both success and error cases
6. **Use Type Guards**: Always use `isZodError()`, `isErrorObject()` in catch blocks
7. **Return, Don't Throw**: Server actions should return results, not throw

## Common Patterns

### Unauthorized Access
```typescript
const session = await getSession()
if (!session?.user) {
  return {
    success: false,
    error: "You must be logged in",
    code: "UNAUTHORIZED",
  }
}

if (session.user.role !== "ADMIN") {
  return {
    success: false,
    error: "Admin access required",
    code: "FORBIDDEN",
  }
}
```

### Validation Errors
```typescript
try {
  const validated = schema.parse(input)
  // ...
} catch (error) {
  if (isZodError(error)) {
    return {
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.flatten().fieldErrors,
    }
  }
  // ...
}
```

### Not Found
```typescript
const item = await db.item.findUnique({ where: { id } })
if (!item) {
  return {
    success: false,
    error: `Item with ID ${id} not found`,
    code: "NOT_FOUND",
  }
}
```

### Conflict (Already Exists)
```typescript
const existing = await db.user.findUnique({ where: { email } })
if (existing) {
  return {
    success: false,
    error: "Email already in use",
    code: "CONFLICT",
  }
}
```

## References

- TypeScript Docs: [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- Zod Documentation: https://zod.dev
- Better Auth Docs: https://better-auth.com

