# Test Suite To-Do List

This document outlines all unit tests that need to be written for the Peak Blooms application. Tests are organized by category and should be completed in batches. Each test file should be co-located with its source file (e.g., `lib/utils.test.ts` next to `lib/utils.ts`).

## Testing Approach

- **Framework**: Vitest (fast, zero-config, native TypeScript support)
- **Test Execution**: `npm run test` (runs all tests once)
- **Watch Mode**: `npm run test:watch` (reruns on file changes)
- **UI Dashboard**: `npm run test:ui` (visual test runner)
- **Pre-commit**: Tests run automatically before every commit via Husky
- **Mocking Strategy**: Mocked Prisma client and dependencies (no test database required)
- **File Location**: Tests live alongside source files with `.test.ts` or `.test.tsx` suffix

## How to Use This Document

1. Pick a category and work through tests in batches
2. Each test includes a brief description and example
3. Use the provided mock helpers from `src/test/mocks.ts`
4. Run `npm run test:watch` while working to see instant feedback
5. Check off tests as they're completed
6. Submit a PR when a batch is done

---

## Category 1: Validation Schemas

**Location**: `lib/validations/`  
**Description**: Test Zod validation schemas for correct schema definition and error messages  
**Difficulty**: ⭐ Easy  
**Time per test**: 2-3 minutes  

### 1.1 Address Validation
- [ ] Test `addressSchema` accepts valid address with all required fields
- [ ] Test `addressSchema` rejects missing `company` field
- [ ] Test `addressSchema` validates correct phone format
- [ ] Test `addressSchema` error messages are clear for invalid inputs

**Example structure**:
```typescript
import { describe, it, expect } from 'vitest'
import { addressSchema } from '@/lib/validations/address'

describe('addressSchema', () => {
  it('should accept valid address', () => {
    const valid = {
      company: 'Acme Inc',
      street: '123 Main St',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      phone: '+1-503-555-0123',
      country: 'US',
    }
    expect(addressSchema.safeParse(valid).success).toBe(true)
  })

  it('should reject missing company', () => {
    const invalid = { street: '123 Main St' /* ... */ }
    const result = addressSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
```

### 1.2 Auth Validation (signup/login)
- [ ] Test email validation accepts valid formats
- [ ] Test password validation requires minimum length
- [ ] Test password validation requires complexity (optional)
- [ ] Test signup schema includes password confirmation

### 1.3 Product Validation
- [ ] Test product schema requires name
- [ ] Test product schema validates price is non-negative
- [ ] Test product schema rejects invalid product types
- [ ] Test collection assignment validation

### 1.4 Collection Validation
- [ ] Test collection name is required
- [ ] Test collection slug is valid format
- [ ] Test collection validates featured status boolean

### 1.5 Checkout Validation
- [ ] Test checkout schema validates cart items
- [ ] Test checkout validates delivery address required
- [ ] Test checkout validates billing if different from delivery (if applicable)

### 1.6 Newsletter Validation
- [ ] Test newsletter email validation
- [ ] Test consent flag validation

### 1.7 Inspiration Validation
- [ ] Test inspiration title required
- [ ] Test inspiration text validation
- [ ] Test inspiration image URL validation

---

## Category 2: Utility Functions

**Location**: `lib/utils.ts`, `lib/cart-utils.ts`, `lib/phone.ts`, etc.  
**Description**: Test pure utility functions for correctness and edge cases  
**Difficulty**: ⭐ Easy  
**Time per test**: 2-5 minutes  

### 2.1 General Utils (lib/utils.ts)
- [ ] Test `cn()` merges Tailwind classes correctly
- [ ] Test `cn()` handles conflicting classes with tailwind-merge
- [ ] Test price multiplier calculation with valid input
- [ ] Test price multiplier clamps to min/max bounds
- [ ] Test price multiplier rejects invalid inputs
- [ ] Test currency formatting returns correct format (USD)
- [ ] Test date formatting returns expected format
- [ ] Test slug generation from string

**Example structure**:
```typescript
import { describe, it, expect } from 'vitest'
import { cn, adjustPrice } from '@/lib/utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('should handle conflicting Tailwind classes', () => {
    const result = cn('px-2 px-4')
    expect(result).toBe('px-4')
  })
})

describe('adjustPrice', () => {
  it('should multiply price by adjustment factor', () => {
    expect(adjustPrice(100, 1.5)).toBe(150)
  })

  it('should clamp to max multiplier', () => {
    expect(adjustPrice(100, 5)).toBe(300) // if max is 3x
  })

  it('should reject negative multiplier', () => {
    expect(() => adjustPrice(100, -1)).toThrow()
  })
})
```

### 2.2 Cart Utils (lib/cart-utils.ts)
- [ ] Test cart total calculation
- [ ] Test cart item quantity validation
- [ ] Test add to cart with valid product
- [ ] Test remove from cart
- [ ] Test clear cart

### 2.3 Phone Utils (lib/phone.ts)
- [ ] Test phone formatting with valid number
- [ ] Test phone validation accepts international format
- [ ] Test phone validation rejects invalid format
- [ ] Test phone country detection

### 2.4 Color Utils (lib/colors.ts)
- [ ] Test color map returns correct values
- [ ] Test color validation for valid colors
- [ ] Test color parsing from strings

### 2.5 Constants (lib/consts.ts)
- [ ] Test all constants are defined and non-empty
- [ ] Test collection limits match validation schemas
- [ ] Test price bounds are reasonable

---

## Category 3: Server Actions (with Mocked Prisma)

**Location**: `app/actions/`  
**Description**: Test server actions with mocked Prisma client  
**Difficulty**: ⭐⭐ Medium  
**Time per test**: 5-10 minutes  
**Pattern**: Mock Prisma responses, test business logic, verify correct queries

### 3.1 Cart Actions (app/actions/cart.ts)
- [ ] Test `addToCart` creates order with CART status
- [ ] Test `addToCart` adds item to existing cart
- [ ] Test `updateCartItem` updates quantity
- [ ] Test `removeCartItem` deletes order item
- [ ] Test `clearCart` removes all items

**Example structure**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockPrismaClient } from '@/test/mocks'
import * as cartActions from '@/app/actions/cart'

vi.mock('@/lib/db', () => ({
  prisma: createMockPrismaClient(),
}))

describe('Cart Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should add item to cart', async () => {
    // Mock Prisma response
    const mockOrder = { id: '1', status: 'CART', items: [] }
    vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockOrder)

    // Call action
    const result = await addToCart('product-1', 2)

    // Assert
    expect(result.success).toBe(true)
    expect(prisma.order.findUnique).toHaveBeenCalled()
  })
})
```

### 3.2 Product Actions (app/actions/products.ts)
- [ ] Test fetch products returns correct shape
- [ ] Test fetch products filters by collection
- [ ] Test fetch single product by ID
- [ ] Test product pagination

### 3.3 Collection Actions (app/actions/collections.ts)
- [ ] Test fetch all collections
- [ ] Test fetch featured collections
- [ ] Test fetch collection by slug
- [ ] Test fetch products in collection

### 3.4 Order Actions (app/actions/orders.ts)
- [ ] Test create order from cart
- [ ] Test order status update
- [ ] Test fetch user orders
- [ ] Test cancel order

### 3.5 User Actions (app/actions/user-actions.ts)
- [ ] Test get current user
- [ ] Test update user profile
- [ ] Test update user email
- [ ] Test update user phone

### 3.6 Inspiration Actions (app/actions/inspirations.ts)
- [ ] Test fetch all inspirations
- [ ] Test fetch inspiration by ID
- [ ] Test search inspirations

---

## Category 4: Data Access Functions

**Location**: `lib/data/`  
**Description**: Test database query functions with mocked Prisma  
**Difficulty**: ⭐⭐ Medium  
**Time per test**: 3-7 minutes  

### 4.1 Product Queries (lib/data/products.ts)
- [ ] Test `getProducts()` returns products with correct fields
- [ ] Test `getProductById()` returns single product
- [ ] Test `getProductsByCollection()` filters by collection
- [ ] Test product queries exclude soft-deleted items

**Example structure**:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { createMockPrismaClient } from '@/test/mocks'
import { getProductById } from '@/lib/data/products'

vi.mock('@/lib/db', () => ({
  prisma: createMockPrismaClient(),
}))

describe('Product Queries', () => {
  it('should fetch product by ID', async () => {
    const mockProduct = {
      id: '1',
      name: 'Roses',
      price: 49.99,
    }
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(mockProduct)

    const result = await getProductById('1')

    expect(result).toEqual(mockProduct)
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    })
  })
})
```

### 4.2 Collection Queries (lib/data/collections.ts)
- [ ] Test `getCollections()` returns all collections
- [ ] Test `getFeaturedCollections()` filters featured items
- [ ] Test `getCollectionBySlug()` returns single collection

### 4.3 User Queries (lib/data/users.ts)
- [ ] Test `getUserById()` returns user
- [ ] Test user queries exclude password
- [ ] Test `getUserByEmail()` finds user

### 4.4 Order Queries (lib/data/orders.ts)
- [ ] Test `getUserOrders()` returns user's orders
- [ ] Test `getOrderById()` returns order with items
- [ ] Test order queries include item snapshots

### 4.5 Inspiration Queries (lib/data/inspirations.ts)
- [ ] Test `getInspirations()` returns all inspirations
- [ ] Test `getInspirationById()` returns single inspiration
- [ ] Test inspiration search functionality

### 4.6 Metrics Queries (lib/data/metrics.ts)
- [ ] Test `getMetrics()` returns correct aggregations
- [ ] Test metrics for time period filtering

---

## Category 5: React Components (UI Components)

**Location**: `src/components/ui/`  
**Description**: Test base UI components render correctly  
**Difficulty**: ⭐⭐ Medium  
**Time per test**: 5-10 minutes  
**Pattern**: Use React Testing Library, test props, test interactions

### 5.1 Button Component
- [ ] Test button renders with label
- [ ] Test button click handler is called
- [ ] Test button disabled state
- [ ] Test button variants (primary, secondary, etc.)

**Example structure**:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('should render with label', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    const { user } = render(<Button onClick={handleClick}>Click</Button>)
    await user.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('should be disabled', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDisabled()
  })
})
```

### 5.2 Form Input
- [ ] Test input renders
- [ ] Test input value changes
- [ ] Test input validation display
- [ ] Test input disabled state

### 5.3 Dialog/Modal
- [ ] Test dialog renders when open
- [ ] Test dialog hidden when closed
- [ ] Test dialog close button works
- [ ] Test dialog onOpenChange callback

### 5.4 Select Component
- [ ] Test select renders options
- [ ] Test select change handler
- [ ] Test select default value
- [ ] Test select disabled state

### 5.5 Checkbox
- [ ] Test checkbox renders
- [ ] Test checkbox toggle
- [ ] Test checkbox label click
- [ ] Test checkbox disabled state

### 5.6 Badge
- [ ] Test badge renders text
- [ ] Test badge variant styling
- [ ] Test badge size prop

### 5.7 Table
- [ ] Test table renders rows
- [ ] Test table renders headers
- [ ] Test table pagination

### 5.8 Autocomplete
- [ ] Test autocomplete shows suggestions
- [ ] Test autocomplete filters options
- [ ] Test autocomplete selection

---

## Category 6: Feature Components

**Location**: `src/components/site/`, `src/components/account/`, `src/components/admin/`  
**Description**: Test complex feature components  
**Difficulty**: ⭐⭐⭐ Hard  
**Time per test**: 10-20 minutes  
**Pattern**: Mock child components, test data flow, test user interactions

### 6.1 Product Display Components
- [ ] Test ProductCard renders product data
- [ ] Test ProductCard price adjustment display
- [ ] Test ProductCard add to cart button
- [ ] Test ProductList renders multiple products
- [ ] Test ProductList loading state
- [ ] Test ProductList empty state

### 6.2 Cart Components
- [ ] Test CartSummary displays total
- [ ] Test CartItems renders items
- [ ] Test CartItem quantity controls
- [ ] Test CartItem remove button
- [ ] Test CartEmpty state

### 6.3 Checkout Components
- [ ] Test CheckoutForm renders address fields
- [ ] Test CheckoutForm validation
- [ ] Test CheckoutForm submission
- [ ] Test CheckoutSummary displays order total

### 6.4 Collection Components
- [ ] Test CollectionCard renders collection
- [ ] Test CollectionFilter filters by type
- [ ] Test CollectionList displays all collections

### 6.5 User Account Components
- [ ] Test AccountHeader displays user info
- [ ] Test ProfileForm updates user data
- [ ] Test OrderHistory renders orders
- [ ] Test OrderDetail shows order items

### 6.6 Admin Components
- [ ] Test ProductManager renders product list
- [ ] Test ProductForm creates/edits product
- [ ] Test CollectionManager renders collections
- [ ] Test OrderManager renders orders

---

## Category 7: Custom Hooks

**Location**: `lib/`  
**Description**: Test custom React hooks  
**Difficulty**: ⭐⭐⭐ Hard  
**Time per test**: 8-15 minutes  
**Pattern**: Use `@testing-library/react` hooks testing utilities

### 7.1 useDebouncedCallback Hook
- [ ] Test hook returns stable callback
- [ ] Test callback delayed by specified time
- [ ] Test callback called only once after debounce
- [ ] Test cleanup on unmount

**Example structure**:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'

describe('useDebouncedCallback', () => {
  it('should debounce callback', async () => {
    const callback = vi.fn()
    const { result } = renderHook(() =>
      useDebouncedCallback(callback, 100)
    )

    act(() => {
      result.current('test')
      result.current('test')
    })

    expect(callback).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(callback).toHaveBeenCalledOnce()
    }, { timeout: 200 })
  })
})
```

---

## Category 8: Integration Tests (Future - Optional)

**Location**: TBD (may use separate test database later)  
**Description**: End-to-end user workflows with real database  
**Difficulty**: ⭐⭐⭐⭐ Very Hard  
**Time per test**: 20-30 minutes  

### 8.1 Complete Checkout Flow
- User adds product to cart
- User updates cart quantity
- User proceeds to checkout
- User enters delivery address
- User completes order
- Order status updates in database

### 8.2 User Registration and Login
- User creates account
- Email validation triggered
- User logs in
- Session persists

### 8.3 Collection Browsing
- User filters products by collection
- User sees correct products
- User applies price filters
- User sorts products

**Note**: These tests are optional for now and can be added when a test database infrastructure is set up.

---

## Implementation Tips

### Mocking Prisma
Always mock Prisma in your setup at the top of test files:
```typescript
import { vi } from 'vitest'
import { createMockPrismaClient } from '@/test/mocks'

vi.mock('@/lib/db', () => ({
  prisma: createMockPrismaClient(),
}))
```

### Testing Zod Schemas
Zod schemas are easy to test—just call `.safeParse()` and check the result:
```typescript
const result = schema.safeParse(data)
expect(result.success).toBe(true)
// or
expect(result.error?.issues).toBeDefined()
```

### Testing Async Functions
Always `await` server actions and use Vitest's async test syntax:
```typescript
it('should do something', async () => {
  const result = await someAsyncFunction()
  expect(result).toEqual(expected)
})
```

### Testing React Components
Use React Testing Library and query by accessible roles:
```typescript
render(<MyComponent />)
expect(screen.getByRole('button')).toBeInTheDocument()
```

### Checking Coverage
Run `npm run test` and check the generated HTML report in `coverage/` folder to see which files need tests.

---

## Progress Tracking

- **Batch 1** (Category 1: Validation Schemas): [ ] Not Started
- **Batch 2** (Category 2: Utility Functions): [ ] Not Started
- **Batch 3** (Category 3: Server Actions): [ ] Not Started
- **Batch 4** (Category 4: Data Access): [ ] Not Started
- **Batch 5** (Category 5: UI Components): [ ] Not Started
- **Batch 6** (Category 6: Feature Components): [ ] Not Started
- **Batch 7** (Category 7: Custom Hooks): [ ] Not Started
- **Batch 8** (Category 8: Integration Tests - Optional): [ ] Not Started

---

## Coverage Goals

- **Phase 1** (Now): Get all critical validations, utilities, and simple components to 50% coverage
- **Phase 2** (Later): Expand to server actions and feature components for 70% coverage
- **Phase 3** (Future): Add integration tests and aim for 85%+ coverage
