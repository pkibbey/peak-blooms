# Peak Blooms Server Actions Documentation

> Zod-validated server actions with full type safety. Auto-generated schema reference available in [`docs/internal/api-schema.json`](./api-schema.json).

## Overview

Peak Blooms uses **Next.js server actions** (not REST endpoints) with full Zod validation and TypeScript type inference. Each function:
- Accepts a single typed object parameter
- Validates input with Zod schema at entry point
- Returns strongly-typed results
- Handles authentication/authorization internally

**Return Type Convention — AppResult<T>** 🔁

All server actions return an `AppResult<T>` discriminated union for safe error handling in components. The shape lives in `src/lib/query-types.ts` and follows this pattern:

```ts
// Success
{ success: true; data: T }

// Error
{ success: false; error: string; code?: ErrorCode; details?: Record<string, string | string[]> }
```

Why this matters:
- Components can check `if (!result.success)` to narrow to `AppError` safely
- Errors are structured with optional `code` and `details` for programmatic handling

See `docs/ERROR_HANDLING_GUIDE.md` for implementation patterns and examples. For type derivation patterns and examples, see `docs/TYPE_DERIVATION.md`.

**Note**: The `/api/` paths in the OpenAPI schema reference represent validation structures, not actual HTTP routes. Import the functions directly as shown below.

---

## Quick Reference

| Function | Import | Parameters |
|----------|--------|-----------|
| **addToCartAction** | `@/app/actions/cart` | `productId`, `quantity?` |
| **updateCartItemAction** | `@/app/actions/cart` | `itemId`, `quantity` |
| **removeFromCartAction** | `@/app/actions/cart` | `itemId` |
| **batchAddToCartAction** | `@/app/actions/cart` | `productIds`, `quantities?` |
| **getCartAction** | `@/app/actions/cart` | None |
| **clearCartAction** | `@/app/actions/cart` | None |
| **cancelOrderAction** | `@/app/actions/orders` | `orderId`, `convertToCart?` |
| **updateOrderStatusAction** | `@/app/actions/orders` | `orderId`, `status` |
| **updateOrderItemPriceAction** | `@/app/actions/orders` | `orderId`, `itemId`, `price` |
| **createOrderAction** | `@/app/actions/orders` | Checkout form data |
| **updateProductAction** | `@/app/actions/products` | `id`, product fields |
| **deleteProductAction** | `@/app/actions/products` | `id` |
| **toggleProductFeaturedAction** | `@/app/actions/products` | `id`, `featured` |
| **getProductCountAction** | `@/app/actions/products` | Filters (optional) |
| **createCollectionAction** | `@/app/actions/collections` | Collection data |
| **updateCollectionAction** | `@/app/actions/collections` | `id`, collection data |
| **deleteCollectionAction** | `@/app/actions/collections` | `id` |
| **toggleCollectionFeaturedAction** | `@/app/actions/collections` | `id`, `featured` |
| **createInspirationAction** | `@/app/actions/inspirations` | Inspiration data |
| **updateInspirationAction** | `@/app/actions/inspirations` | `id`, inspiration data |
| **deleteInspirationAction** | `@/app/actions/inspirations` | `id` |
| **approveUserAction** | `@/app/actions/admin-users` | `userId` |
| **unapproveUserAction** | `@/app/actions/admin-users` | `userId` |
| **updateUserPriceMultiplierAction** | `@/app/actions/admin-users` | `userId`, `multiplier` |
| **createUserAction** | `@/app/actions/admin-users` | User data |
| **recordMetricAction** | `@/app/actions/metrics` | `type`, `name`, `duration` |
| **getMetricsAction** | `@/app/actions/metrics` | None |
| **clearMetricsAction** | `@/app/actions/metrics` | None |
| **searchProducts** | `@/app/actions/search` | `searchTerm` |
| **deleteBlobAction** | `@/app/actions/blob` | `url` |

---

## Cart Operations

### Add Item to Cart
```typescript
import { addToCartAction } from "@/app/actions/cart"
import type { AddToCartInput } from "@/lib/validations/checkout"

const result = await addToCartAction({
  productId: "550e8400-e29b-41d4-a716-446655440001",
  quantity: 2 // optional, defaults to 1
})
```

**Parameters:**
- `productId` (string, UUID) - Product to add
- `quantity` (number, 1-999, optional)

**Requires:** User authentication, approved account

---

### Update Cart Item Quantity
```typescript
import { updateCartItemAction } from "@/app/actions/cart"

await updateCartItemAction({
  itemId: "550e8400-e29b-41d4-a716-446655440001",
  quantity: 5
})
```

**Requires:** User authentication, order ownership

---

### Remove Item from Cart
```typescript
import { removeFromCartAction } from "@/app/actions/cart"

await removeFromCartAction({
  itemId: "550e8400-e29b-41d4-a716-446655440001"
})
```

**Requires:** User authentication, order ownership

---

### Batch Add to Cart
```typescript
import { batchAddToCartAction } from "@/app/actions/cart"

// Same quantity for all
await batchAddToCartAction({
  productIds: ["uuid-1", "uuid-2", "uuid-3"],
  quantities: 1
})

// Different quantities per product
await batchAddToCartAction({
  productIds: ["uuid-1", "uuid-2", "uuid-3"],
  quantities: [1, 2, 3]
})
```

**Requires:** User authentication, approved account

---

### Get Cart
```typescript
import { getCartAction } from "@/app/actions/cart"

const cart = await getCartAction()
```

**Requires:** User authentication

---

### Clear Cart
```typescript
import { clearCartAction } from "@/app/actions/cart"

await clearCartAction()
```

---

## Order Operations

### Cancel Order
```typescript
import { cancelOrderAction } from "@/app/actions/orders"

await cancelOrderAction({
  orderId: "550e8400-e29b-41d4-a716-446655440001",
  convertToCart: false // optional
})
```

**Requires:** User authentication, order ownership

---

### Update Order Status
```typescript
import { updateOrderStatusAction } from "@/app/actions/orders"

await updateOrderStatusAction({
  orderId: "550e8400-e29b-41d4-a716-446655440001",
  status: "CONFIRMED" // CART | PENDING | CONFIRMED | OUT_FOR_DELIVERY | DELIVERED | CANCELLED
})
```

**Requires:** Admin authentication

---

### Update Order Item Price
```typescript
import { updateOrderItemPriceAction } from "@/app/actions/orders"

await updateOrderItemPriceAction({
  orderId: "550e8400-e29b-41d4-a716-446655440001",
  itemId: "550e8400-e29b-41d4-a716-446655440002",
  price: 49.99
})
```

**Requires:** Admin authentication

---

### Create Order
```typescript
import { createOrderAction } from "@/app/actions/orders"

const order = await createOrderAction({
  // Checkout form data with delivery address
  // See schema in src/lib/validations/checkout.ts
})
```

**Requires:** User authentication, approved account, non-empty cart

---

## Product Operations

### Update Product
```typescript
import { updateProductAction } from "@/app/actions/products"

await updateProductAction({
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "Red Roses",
  slug: "red-roses",
  description: "Beautiful red roses",
  image: "https://...",
  price: 49.99,
  colors: ["red"],
  productType: "FLOWER",
  featured: true,
  collectionIds: ["uuid-1"]
})
```

**Requires:** Admin authentication

---

### Delete Product
```typescript
import { deleteProductAction } from "@/app/actions/products"

await deleteProductAction({
  id: "550e8400-e29b-41d4-a716-446655440001"
})
```

**Note:** Soft delete (sets `deletedAt` field)  
**Requires:** Admin authentication

---

### Toggle Product Featured
```typescript
import { toggleProductFeaturedAction } from "@/app/actions/products"

await toggleProductFeaturedAction({
  id: "550e8400-e29b-41d4-a716-446655440001",
  featured: true
})
```

**Requires:** Admin authentication

---

### Get Product Count
```typescript
import { getProductCountAction } from "@/app/actions/products"

const count = await getProductCountAction()

// With filters
const count = await getProductCountAction({
  boxlotOnly: true,
  query: "roses"
})
```

---

## Collection Operations

### Create Collection
```typescript
import { createCollectionAction } from "@/app/actions/collections"

await createCollectionAction({
  name: "Summer Blooms",
  slug: "summer-blooms",
  image: "https://...",
  description: "Summer flowers",
  featured: true,
  productIds: ["uuid-1", "uuid-2"] // optional
})
```

**Requires:** Admin authentication

---

### Update Collection
```typescript
import { updateCollectionAction } from "@/app/actions/collections"

await updateCollectionAction({
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "Summer Blooms",
  slug: "summer-blooms",
  image: "https://...",
  description: "Summer flowers",
  featured: true,
  productIds: ["uuid-1", "uuid-2"]
})
```

**Requires:** Admin authentication

---

### Delete Collection
```typescript
import { deleteCollectionAction } from "@/app/actions/collections"

await deleteCollectionAction({
  id: "550e8400-e29b-41d4-a716-446655440001"
})
```

**Requires:** Admin authentication

---

### Toggle Collection Featured
```typescript
import { toggleCollectionFeaturedAction } from "@/app/actions/collections"

await toggleCollectionFeaturedAction({
  id: "550e8400-e29b-41d4-a716-446655440001",
  featured: true
})
```

**Requires:** Admin authentication

---

## Inspiration Operations

### Create Inspiration
```typescript
import { createInspirationAction } from "@/app/actions/inspirations"

await createInspirationAction({
  name: "Garden Ideas",
  slug: "garden-ideas",
  subtitle: "Design inspiration",
  image: "https://...",
  excerpt: "Get inspired",
  text: "Full article text",
  productSelections: [
    { productId: "uuid-1", quantity: 3 },
    { productId: "uuid-2", quantity: 1 }
  ]
})
```

**Requires:** Admin authentication

---

### Update Inspiration
```typescript
import { updateInspirationAction } from "@/app/actions/inspirations"

await updateInspirationAction({
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "Garden Ideas",
  slug: "garden-ideas",
  subtitle: "Design inspiration",
  image: "https://...",
  excerpt: "Get inspired",
  text: "Full article text",
  productSelections: [...]
})
```

**Requires:** Admin authentication

---

### Delete Inspiration
```typescript
import { deleteInspirationAction } from "@/app/actions/inspirations"

await deleteInspirationAction({
  id: "550e8400-e29b-41d4-a716-446655440001"
})
```

**Requires:** Admin authentication

---

## Admin Operations

### Approve User
```typescript
import { approveUserAction } from "@/app/actions/admin-users"

await approveUserAction({
  userId: "550e8400-e29b-41d4-a716-446655440001"
})
```

**Requires:** Admin authentication

---

### Unapprove User
```typescript
import { unapproveUserAction } from "@/app/actions/admin-users"

await unapproveUserAction({
  userId: "550e8400-e29b-41d4-a716-446655440001"
})
```

**Requires:** Admin authentication

---

### Update User Price Multiplier
```typescript
import { updateUserPriceMultiplierAction } from "@/app/actions/admin-users"

await updateUserPriceMultiplierAction({
  userId: "550e8400-e29b-41d4-a716-446655440001",
  multiplier: 1.5 // 0.5-2.0 range
})
```

**Requires:** Admin authentication

---

### Create User
```typescript
import { createUserAction } from "@/app/actions/admin-users"

await createUserAction({
  email: "user@example.com",
  name: "John Doe",
  phone: "+1234567890",
  role: "CUSTOMER", // CUSTOMER | ADMIN | SUBSCRIBER
  priceMultiplier: 1.0,
  approved: true
})
```

**Requires:** Admin authentication

---

## Metrics Operations

### Record Metric
```typescript
import { recordMetricAction } from "@/app/actions/metrics"

await recordMetricAction({
  type: "QUERY", // SEED | QUERY | FETCH | ADMIN_QUERY | USER_QUERY
  name: "fetch-products",
  duration: 125 // milliseconds
})
```

**Requires:** Admin authentication

---

### Get Metrics
```typescript
import { getMetricsAction } from "@/app/actions/metrics"

const metrics = await getMetricsAction()
```

**Requires:** Admin authentication

---

### Clear Metrics
```typescript
import { clearMetricsAction } from "@/app/actions/metrics"

await clearMetricsAction()
```

**Requires:** Admin authentication

---

## Search Operations

### Search Products
```typescript
import { searchProducts } from "@/app/actions/search"

const results = await searchProducts({
  searchTerm: "roses"
})

// Results include products with prices adjusted for user's multiplier
```

---

## Blob Operations

### Delete Blob
```typescript
import { deleteBlobAction } from "@/app/actions/blob"

await deleteBlobAction({
  url: "https://blob.vercel-storage.com/..."
})
```

**Requires:** Admin authentication

---

## Error Handling

All server actions throw errors on validation failure with detailed Zod messages:

```typescript
try {
  await addToCartAction({ productId: "invalid", quantity: 1000 })
} catch (error) {
  // Error: "productId: Invalid uuid, quantity: Number must be less than or equal to 999"
}
```

---

## Type Safety

All functions are fully typed via Zod schema inference:

```typescript
import { addToCartAction, type AddToCartInput } from "@/app/actions/cart"

// Full IDE autocomplete and type checking
const input: AddToCartInput = {
  productId: "550e8400-e29b-41d4-a716-446655440001",
  quantity: 5
}

await addToCartAction(input)
```

---

## Schema References

All Zod schemas are in `src/lib/validations/`:

- **checkout.ts** - Cart & order operations
- **product.ts** - Product operations
- **collection.ts** - Collection operations
- **inspiration.ts** - Inspiration operations
- **auth.ts** - User & admin operations
- **metrics.ts** - Metrics operations
- **search.ts** - Search operations
- **blob.ts** - Blob operations

---

## Regenerating OpenAPI Schema

When you modify Zod schemas:

```bash
npm run generate:schema
```

This updates `docs/internal/api-schema.json` (OpenAPI 3.0.0 spec) for reference in external tools like Swagger UI or Postman.

---

## Notes

- All IDs are UUIDs (validated at entry point)
- Authentication is checked inside each action
- Price fields support market pricing
- Product deletion is soft-delete
- Order status flow: CART → PENDING → CONFIRMED → OUT_FOR_DELIVERY → DELIVERED/CANCELLED
- The OpenAPI schema (`api-schema.json`) documents validation rules, not HTTP routes
