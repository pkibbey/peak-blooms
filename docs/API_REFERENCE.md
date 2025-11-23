# Peak Blooms API Documentation

## Base URL
`http://localhost:3000/api`

## Authentication
All endpoints except GET `/products` and GET `/categories` require authentication. Include valid session cookies from NextAuth.

## Products

### List Products
```
GET /api/products
```

Query Parameters:
- `categoryId` (optional) - Filter by category ID
- `featured` (optional) - Set to "true" to show only featured products

Response:
```json
[
  {
    "id": "clx...",
    "name": "Red Roses",
    "slug": "red-roses",
    "description": "Beautiful deep red roses",
    "image": "/featured-products/red-roses.jpg",
    "price": 45.99,
    "stemLength": 45,
    "countPerBunch": 12,
    "stock": 50,
    "featured": true,
    "categoryId": "clx...",
    "createdAt": "2025-11-23T...",
    "updatedAt": "2025-11-23T...",
    "category": { "id": "...", "name": "Roses", ... }
  }
]
```

### Create Product
```
POST /api/products
Authorization: Required (Admin only)
Content-Type: application/json
```

Request Body:
```json
{
  "name": "White Roses",
  "slug": "white-roses",
  "description": "Pure white roses for weddings",
  "image": "/featured-products/white-roses.jpg",
  "price": 48.99,
  "stemLength": 50,
  "countPerBunch": 12,
  "stock": 35,
  "categoryId": "clx...",
  "featured": false
}
```

## Categories

### List Categories
```
GET /api/categories
```

Response:
```json
[
  {
    "id": "clx...",
    "name": "Roses",
    "slug": "roses",
    "image": "/featured-categories/roses.jpg",
    "createdAt": "2025-11-23T...",
    "updatedAt": "2025-11-23T..."
  }
]
```

### Create Category
```
POST /api/categories
Authorization: Required (Admin only)
Content-Type: application/json
```

Request Body:
```json
{
  "name": "Sunflowers",
  "slug": "sunflowers",
  "image": "/featured-categories/sunflowers.jpg"
}
```

## User Profile

### Get Current User Profile
```
GET /api/users/profile
Authorization: Required
```

Response:
```json
{
  "id": "clx...",
  "email": "user@example.com",
  "name": "John Doe",
  "image": null,
  "role": "CUSTOMER",
  "approved": true,
  "createdAt": "2025-11-23T..."
}
```

### Update Current User Profile
```
PATCH /api/users/profile
Authorization: Required
Content-Type: application/json
```

Request Body:
```json
{
  "name": "Jane Doe",
  "image": "https://example.com/avatar.jpg"
}
```

## Shopping Cart

### Get Shopping Cart
```
GET /api/cart
Authorization: Required
```

Response:
```json
{
  "id": "clx...",
  "userId": "clx...",
  "createdAt": "2025-11-23T...",
  "updatedAt": "2025-11-23T...",
  "items": [
    {
      "id": "clx...",
      "cartId": "clx...",
      "productId": "clx...",
      "quantity": 2,
      "createdAt": "2025-11-23T...",
      "updatedAt": "2025-11-23T...",
      "product": {
        "id": "clx...",
        "name": "Red Roses",
        "price": 45.99,
        ...
      }
    }
  ],
  "total": 91.98
}
```

### Add Item to Cart
```
POST /api/cart
Authorization: Required
Content-Type: application/json
```

Request Body:
```json
{
  "productId": "clx...",
  "quantity": 2
}
```

Response: Cart item details with product info

### Update Cart Item Quantity
```
PATCH /api/cart/items/[id]
Authorization: Required
Content-Type: application/json
```

Request Body:
```json
{
  "quantity": 3
}
```

### Remove Item from Cart
```
DELETE /api/cart/items/[id]
Authorization: Required
```

Response:
```json
{
  "message": "Item removed from cart"
}
```

## Orders

### Get User's Orders
```
GET /api/orders
Authorization: Required
```

Response:
```json
[
  {
    "id": "clx...",
    "userId": "clx...",
    "status": "CONFIRMED",
    "total": 183.97,
    "createdAt": "2025-11-23T...",
    "updatedAt": "2025-11-23T...",
    "items": [
      {
        "id": "clx...",
        "orderId": "clx...",
        "productId": "clx...",
        "quantity": 2,
        "price": 45.99,
        "product": { ... }
      }
    ]
  }
]
```

### Create Order
```
POST /api/orders
Authorization: Required (Approved users only)
```

Request Body: Empty (uses current shopping cart)

Response: New order with all details

**Important**: User must be approved to create orders. The endpoint will return 403 if `user.approved === false`.

## Error Responses

### Unauthorized
```
Status: 401
{
  "error": "Unauthorized"
}
```

### Forbidden (Not Approved or Not Admin)
```
Status: 403
{
  "error": "Your account is not approved for purchases"
}
```

### Bad Request
```
Status: 400
{
  "error": "Missing required fields"
}
```

### Not Found
```
Status: 404
{
  "error": "Resource not found"
}
```

### Server Error
```
Status: 500
{
  "error": "Failed to perform operation"
}
```

## Authentication Flow

1. User visits `/auth/signin` (page to be created)
2. User enters email and clicks "Send Magic Link"
3. NextAuth sends email with verification link via Resend
4. User clicks link to verify email
5. User automatically signed in and redirected to dashboard
6. New account created with `approved: false`
7. Admin reviews and approves account
8. Approved users can view prices and create orders

## Usage Example (JavaScript/TypeScript)

```typescript
// Get products
const products = await fetch('/api/products?featured=true').then(r => r.json());

// Add to cart (requires auth)
const addedItem = await fetch('/api/cart', {
  method: 'POST',
  body: JSON.stringify({
    productId: 'clx...',
    quantity: 2
  })
}).then(r => r.json());

// Get cart
const cart = await fetch('/api/cart').then(r => r.json());

// Create order (requires approved user)
const order = await fetch('/api/orders', {
  method: 'POST'
}).then(r => r.json());

// Get order history
const orders = await fetch('/api/orders').then(r => r.json());
```

## Notes

- All timestamps are in ISO 8601 format
- Prices are stored as floating-point numbers
- Product IDs and user IDs are 25-character CUID strings
- Stock is an integer (0 or positive)
- All authenticated routes are protected by NextAuth session
- Shopping cart is created automatically on first cart access
- Orders automatically clear the user's shopping cart
