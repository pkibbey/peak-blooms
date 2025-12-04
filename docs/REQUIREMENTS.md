# Peak Blooms Requirements

## Overview
Peak Blooms is a wholesale flower shop application designed to operate as a clean, efficient B2B e-commerce store while incorporating B2C-like inspirational content to appeal to smaller florist businesses.

## User Roles

### 1. Customer
- **Access:** Requires approval.
- **Capabilities:**
  - View full store with prices.
  - Add items to shopping cart.
  - Checkout and purchase.
  - View inspirational content.

### 2. Admin
- **Capabilities:**
  - Manage products and inventory.
  - Approve or reject new customer account requests.
  - View analytics and user stats.
  - Manage content.

### 3. Guest (Unauthenticated/Unapproved)
- **Capabilities:**
  - View full store products (catalog mode).
  - View inspirational content.
- **Restrictions:**
  - **Prices:** Hidden.
  - **Shopping Cart:** Disabled/Hidden.
  - **Checkout:** Disabled.

## Functional Features

### User Authentication & Approval
- **Registration:** Users can submit a request for a customer account.
- **Approval Workflow:** New accounts are pending until approved by an Admin.
- **Login:** Standard secure login for approved customers and admins.

### Product Catalog & Search
- **Full Text Search:** Robust search capability to find products easily.
- **Visibility:** Products are visible to all users.
- **Pricing:** Visible only to logged-in, approved customers.

### Shopping Experience
- **Cart:** Functional only for approved customers.
- **Checkout:** Streamlined B2B checkout process.

### Navigation
- **Global Navigation:** Persistent top-level menu.
- **Interaction:** Menu items must be directly accessible; no hiding items in mouseover dropdowns.

### Analytics & Lead Generation
- **Usage Stats:** Collection of user behavior data to inform UI improvements.
- **Lead Collection:** Mechanisms to capture details from potential new business leads (e.g., inquiry forms, newsletter signup for guests).

### Content
- **Inspirational Content:** Blog-like or gallery sections showcasing floral arrangements to inspire florists.

## UI/UX Standards

### Information Visibility
- **Never hide important information from the UI.** Critical details like pricing, product specifications, variant options, and user status should always be visible to users—not hidden behind hover states, tooltips, or other interactions.

### User Feedback
- **Always use toast messages instead of alerts.** Use the `toast` function from `sonner` for all user notifications:
  - `toast.success()` for successful actions (e.g., "Added to cart!")
  - `toast.error()` for error messages
  - `toast.info()` for informational messages
  - Never use browser `alert()` dialogs

#### Example Usage
```tsx
import { toast } from "sonner";

// Success message
toast.success("Added to cart!");

// Error message
toast.error("Failed to add item to cart");

// With custom content
toast.success(`Added "${productName}" to cart!`);
```

### Product Cards
- Display price visibly at all times for approved users only
- Show "From $X.XX" when multiple price variants exist
- Default to the first variant for quick-add functionality

### Authentication States
- **Signed out users:** Show "Sign in for pricing" and provide sign-in CTAs
- **Unapproved users:** Show "Contact for pricing" and disabled action buttons
- **Approved users:** Show full pricing, specs, and enabled purchase actions

### UI Controls & Buttons
- **Consistency requirement:** All primary, secondary, and interactive controls (CTAs, cart links, menu toggles, etc.) MUST use the shared `Button` primitive located at `src/components/ui/button.tsx`. This guarantees consistent visuals, behavior, and keyboard/focus accessibility across the application. Use `asChild` when wrapping Next.js `Link` to preserve routing semantics while applying button styling.
- **Button text must never change.** Button labels should remain static at all times. Loading or processing states are indicated only through the disabled state styling (opacity reduction, cursor: not-allowed, disabled pointer events). Do not change button text based on form state, submission status, or any other dynamic condition.

## Component & Architecture Standards

### Data Fetching
- **Always prefer server-side data fetching over client-side.** Fetch data in server components and pass it down as props. This ensures:
  - Better performance (no loading states, data available on first render)
  - Proper SEO and SSR support
  - Cleaner code without `useEffect` fetch patterns
  - Automatic updates via `router.refresh()` after mutations

- Use `router.refresh()` from `next/navigation` after mutations (e.g., adding to cart) to trigger server component re-renders and update data.

#### Example Pattern
```tsx
// ✅ Good: Server component fetches data
// layout.tsx (server component)
const cart = await getOrCreateCart();
const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
return <Nav cartCount={cartCount} />;

// ❌ Bad: Client-side fetch with useEffect
useEffect(() => {
  fetch('/api/cart').then(res => res.json()).then(setCartCount);
}, []);
```

### Navigation
- **Always use Next.js router methods instead of `window.location`.** This ensures:
  - Proper client-side navigation with maintained state
  - Better performance (no full page reload)
  - Consistent behavior with Next.js routing

| Instead of | Use |
|------------|-----|
| `window.location.href = "/path"` | `router.push("/path")` |
| `window.location.reload()` | `router.refresh()` |

### Authentication & Authorization
- **Use server-side auth checks instead of client-side guards.** Protect pages at the server level using `redirect()` from `next/navigation`:

```tsx
// ✅ Good: Server component with redirect
// app/cart/page.tsx
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/current-user"

export default async function CartPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/signin?callbackUrl=/cart")
  if (!user.approved) redirect("/auth/pending-approval")
  // ... render page
}

// ❌ Bad: Client-side auth guard with useEffect
"use client"
useEffect(() => {
  if (!session) router.push("/auth/signin")
}, [session])
```
