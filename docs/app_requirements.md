# Application Requirements

This document outlines core requirements and standards that must be followed throughout the Peak Blooms application.

## UI/UX Requirements

### Information Visibility

- **Never hide important information from the UI.** Critical details like pricing, product specifications, variant options, and user status should always be visible to users—not hidden behind hover states, tooltips, or other interactions.

### User Feedback

- **Always use toast messages instead of alerts.** Use the `toast` function from `sonner` for all user notifications:
  - `toast.success()` for successful actions (e.g., "Added to cart!")
  - `toast.error()` for error messages
  - `toast.info()` for informational messages
  - Never use browser `alert()` dialogs

### Example Usage

```tsx
import { toast } from "sonner";

// Success message
toast.success("Added to cart!");

// Error message
toast.error("Failed to add item to cart");

// With custom content
toast.success(`Added "${productName}" to cart!`);
```

## Component Standards

### Data Fetching

- **Always prefer server-side data fetching over client-side.** Fetch data in server components and pass it down as props. This ensures:
  - Better performance (no loading states, data available on first render)
  - Proper SEO and SSR support
  - Cleaner code without `useEffect` fetch patterns
  - Automatic updates via `router.refresh()` after mutations

- Use `router.refresh()` from `next/navigation` after mutations (e.g., adding to cart) to trigger server component re-renders and update data.

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
import { getCurrentUser } from "@/lib/auth-utils"

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

### Example Pattern

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

### Buttons

- **Button text must never change.** Button labels should remain static at all times. Loading or processing states are indicated only through the disabled state styling (opacity reduction, cursor: not-allowed, disabled pointer events). Do not change button text based on form state, submission status, or any other dynamic condition.

### Product Cards

- Display price and variant specs (e.g., "50cm • 10 stems") visibly at all times for approved users
- Show "From $X.XX" when multiple price variants exist
- Default to the first variant for quick-add functionality

### Authentication States

- **Signed out users:** Show "Sign in for pricing" and provide sign-in CTAs
- **Unapproved users:** Show "Contact for pricing" and disabled action buttons
- **Approved users:** Show full pricing, specs, and enabled purchase actions
