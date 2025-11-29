# Price Multiplier Feature

The Price Multiplier feature allows administrators to adjust all product prices on a per-account basis. This enables flexible pricing strategies such as wholesale discounts, premium markups, or custom pricing for specific customers.

## Overview

Each user account has a `priceMultiplier` field that defaults to `1.0` (standard pricing). When a user views products, adds items to their cart, or places an order, all prices are automatically adjusted by their multiplier.

### How It Works

1. **Base prices** are stored in the database for each product variant
2. **Adjusted prices** = Base Price × Price Multiplier
3. All prices displayed to the user reflect their adjusted price
4. Order totals and line item prices are stored with the adjusted price

### Example

| Base Price | Multiplier | Adjusted Price |
|------------|------------|----------------|
| $25.00     | 1.0        | $25.00         |
| $25.00     | 0.85       | $21.25         |
| $25.00     | 1.15       | $28.75         |

## Valid Multiplier Range

The price multiplier must be between **0.5** and **2.0**:

- **Minimum (0.5)**: 50% discount (half price)
- **Maximum (2.0)**: 100% markup (double price)
- **Default (1.0)**: Standard pricing (no adjustment)

This range prevents accidental extreme values while allowing significant flexibility for pricing strategies.

## Common Use Cases

### Wholesale Discount (0.8 - 0.9)
For volume buyers or business accounts that receive reduced pricing:
- `0.8` = 20% discount
- `0.85` = 15% discount
- `0.9` = 10% discount

### Premium Customer (0.9 - 0.95)
For loyal customers receiving a small discount:
- `0.95` = 5% discount

### Standard Pricing (1.0)
Default for all new accounts - no adjustment applied.

### Premium Markup (1.1 - 1.5)
For accounts requiring expedited handling or premium services:
- `1.1` = 10% markup
- `1.25` = 25% markup

## Managing Price Multipliers

### Admin Interface

Administrators can view and edit price multipliers on the User Management page (`/admin/users`):

1. Navigate to **Admin Dashboard** → **Users**
2. Find the approved user you want to modify
3. Edit the **Price ×** field next to their name
4. Click **Save** to apply the change

The multiplier takes effect immediately for all future product views, cart totals, and orders.

### API Endpoint

Programmatic updates can be made via the admin API:

```http
PATCH /api/admin/users/[userId]
Content-Type: application/json
Authorization: (Admin session required)

{
  "priceMultiplier": 0.85
}
```

**Response codes:**
- `200`: Successfully updated
- `400`: Invalid multiplier (outside 0.5-2.0 range)
- `401`: Unauthorized (not admin)

## Technical Implementation

### Where Prices Are Adjusted

Prices are adjusted **server-side** in all API responses:

| Endpoint | Description |
|----------|-------------|
| `GET /api/products` | Product listings |
| `GET /api/products/[id]` | Single product detail |
| `GET /api/cart` | Shopping cart with totals |
| `GET /api/inspirations` | Inspiration product bundles |
| `GET /api/inspirations/[id]` | Single inspiration detail |
| `POST /api/orders` | Order creation (stores adjusted prices) |

### Price Display

- Adjusted prices are **always rounded to 2 decimal places** for currency display
- The multiplier value is **never shown to customers** - they only see final prices
- Only administrators can view and modify multipliers

### Order History

When an order is placed:
- Line item prices are stored with the **adjusted price at time of purchase**
- The user's multiplier at order time is used (subsequent multiplier changes don't affect past orders)
- This ensures accurate historical records and prevents retroactive price changes

## Database Schema

The `priceMultiplier` field is stored on the `User` model:

```prisma
model User {
  // ... other fields
  priceMultiplier Float @default(1.0) // Range: 0.5 - 2.0
}
```

## Utility Functions

Located in `src/lib/utils.ts`:

```typescript
// Constants
export const MIN_PRICE_MULTIPLIER = 0.5
export const MAX_PRICE_MULTIPLIER = 2.0

// Apply multiplier to a base price (returns value rounded to 2 decimal places)
export function adjustPrice(basePrice: number, multiplier: number = 1.0): number

// Validate a multiplier is within acceptable bounds
export function isValidPriceMultiplier(multiplier: number): boolean
```

## Important Notes

1. **Unauthenticated users** see base prices (multiplier of 1.0)
2. **New accounts** default to multiplier 1.0 until an admin adjusts it
3. **Price filters** on product listings use base prices in the database query, then adjust results
4. **Admin product management** always shows base prices for editing (multipliers don't affect admin views)
