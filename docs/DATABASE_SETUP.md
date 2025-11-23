# Database & Authentication Setup Guide

## Overview
Peak Blooms now has a complete database layer with Prisma ORM and NextAuth.js authentication.

## What's Been Installed

### Dependencies
- **@prisma/client** - Type-safe database client
- **prisma** - ORM and migration tool
- **next-auth** - Authentication framework
- **@auth/prisma-adapter** - Prisma adapter for NextAuth
- **resend** - Email service for magic link authentication

## Project Structure

### Database Schema (`prisma/schema.prisma`)
The schema includes the following models:
- **User** - Stores user accounts with approval status and role (CUSTOMER/ADMIN)
- **Account** - NextAuth account linking
- **Session** - NextAuth session management
- **VerificationToken** - Email verification tokens
- **Category** - Product categories
- **Product** - Flower products with stem length, count per bunch, and pricing
- **ShoppingCart** - User shopping carts
- **CartItem** - Individual cart items
- **Order** - User orders with status tracking
- **OrderItem** - Individual order items

### API Routes

#### Products
- `GET /api/products` - List all products (filter by categoryId, featured)
- `POST /api/products` - Create new product (admin only)

#### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create new category (admin only)

#### User Profile
- `GET /api/users/profile` - Get current user's profile
- `PATCH /api/users/profile` - Update current user's profile

#### Shopping Cart
- `GET /api/cart` - Get current user's shopping cart
- `POST /api/cart` - Add item to cart
- `PATCH /api/cart/items/[id]` - Update item quantity
- `DELETE /api/cart/items/[id]` - Remove item from cart

#### Orders
- `GET /api/orders` - Get current user's orders
- `POST /api/orders` - Create new order from cart (approved users only)

### Authentication (`src/lib/auth.ts`)
- Email magic link authentication with Resend
- NextAuth.js configuration with Prisma adapter
- Custom session callbacks to include user approval status and role

### Utility Functions (`src/lib/auth-utils.ts`)
- `getCurrentUser()` - Get current authenticated user
- `isAdmin()` - Check if user is admin
- `isApproved()` - Check if user is approved
- `getOrCreateCart()` - Get or create user's shopping cart
- `calculateCartTotal()` - Calculate shopping cart total

### Database Client (`src/lib/db.ts`)
- Singleton PrismaClient instance with query logging

## Setup Instructions

### 1. Get a Vercel Postgres Database

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your Peak Blooms project
3. Click the **Storage** tab
4. Click **Create Database** and select **Postgres**
5. Follow the setup wizard

Copy the `DATABASE_URL` connection string and add it to `.env`:

```bash
DATABASE_URL="postgresql://..."
```

### 2. Generate a NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Add it to `.env`:

```bash
NEXTAUTH_SECRET="your-generated-secret"
```

### 3. Set Up Resend Email Service

1. Go to https://resend.com and create an account
2. Get your API key
3. Add it to `.env`:

```bash
RESEND_API_KEY="your-resend-api-key"
```

### 4. Run Database Migrations

```bash
npm run db:push
```

This applies the schema to your Neon Postgres database.

## Environment Variables

Create `.env` with:

```env
# Database - from Vercel Postgres
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Email Service
RESEND_API_KEY="your-resend-key"
```

## Next Steps

### 1. Update NextAuth Configuration
The current email configuration needs Resend settings. Update the `from` email address in `src/lib/auth.ts` once you have a verified domain in Resend.

### 2. Add Authentication Pages
Create sign-in, verify request, and error pages:
- `src/app/auth/signin/page.tsx`
- `src/app/auth/verify-request/page.tsx`
- `src/app/auth/error/page.tsx`

### 3. Add Admin Role Checks
The POST endpoints for creating products/categories need admin authentication checks. Add this to each admin endpoint:

```typescript
const user = await getCurrentUser();
if (!isAdmin()) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
```

### 4. Create Admin Dashboard
Build an admin section to:
- Approve/reject user accounts
- Manage products and categories
- View orders

### 5. Update Components
Refactor hardcoded data in components to use the new API endpoints:
- `src/components/site/FeaturedProducts.tsx`
- `src/components/site/FeaturedCollections.tsx`

### 6. Add Price Visibility Logic
Implement conditional price display based on user approval status:

```typescript
const user = await getCurrentUser();
const isApprovedUser = user?.approved === true;
// Show prices only to approved users
```

## Database Operations

### Common Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (GUI for database)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name "migration-name"
```

## User Approval Workflow

1. New users sign up with email magic link
2. Account created with `approved: false`
3. Admin reviews and approves accounts
4. Approved users can:
   - View product prices
   - Add items to cart
   - Create orders

Unapproved users:
- Can browse products
- Cannot see prices
- Cannot checkout

## Notes

- The email provider currently uses Resend with a development email address. Update to your verified domain in production.
- Session tokens are stored in the database and expire after 30 days by default
- All passwords are managed by NextAuth.js (no password storage needed)
- The database is configured for PostgreSQL. Adjust provider in `prisma/schema.prisma` if needed.
