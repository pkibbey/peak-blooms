# Style Guide

## Aesthetic Overview
The site aims for a clean, professional, modern, and high-quality aesthetic that stands out from typical wholesale flower sites. It balances efficient B2B utility with B2C visual appeal.

## Color Palette

### Primary Colors (Backgrounds & Layout)
- **Whites:** Clean backgrounds for content areas.
- **Greys:** Various shades for text, borders, and subtle background differentiation.
  - *Light Grey:* Backgrounds for sections.
  - *Medium Grey:* Borders, secondary text.
  - *Dark Grey:* Primary text, headings.

### Accent Colors
- **Elegant Green:** Used for primary actions (e.g., "Add to Cart"), success states, and nature-related highlights.
- **Crimson:** Used for call-to-action buttons, alerts, or specific design highlights to add vibrancy and contrast.

### Potential analagous color scheme values
- **Primary Color (#1F332E):** Use this for your footer, hero banner background (as you intended), or as the main background for darker sections. It conveys elegance and depth.

- **Secondary Color (#374A47):** This slightly lighter, cool tone is excellent for button hovers, subtle borders, or secondary elements like feature boxes. It keeps the design cohesive yet offers variation.

- **Accent Color (#B45F68):** This is your Call-to-Action (CTA) color. Use it sparingly for buttons, links, and important alerts to draw the user's eye, replicating the visual pop of the vibrant flowers.

- **Neutral Color (#FAF7F0):** Use this soft off-white for all primary text and main content backgrounds to ensure readability and a warm, inviting feel.

## Color Mode (Theme)

This site intentionally uses a single, default light theme and will never offer a dark theme option. All design tokens, component styles, and layout choices should assume a consistent light appearance (white backgrounds, dark grey text, muted greys for borders) so photography and brand colors remain consistent across devices. Do not add a color-mode toggle or dark-mode-specific styles — the product's visual identity is intentionally single-theme and optimized for a bright, light-first experience.

## UI Components

### Cards (Products, Content)
- **Shape:** Very subtle rounded corners (`rounded-xs` in Tailwind).
- **Depth:** Slight drop shadows to create a sense of depth and separation from the background (e.g., `shadow-sm` or `shadow-md`).
- **Behavior:** Clean hover states that might slightly elevate the card or intensify the shadow.

### Navigation
- **Structure:** Global navigation bar.
- **Behavior:** No mouseover dropdowns. All main categories should be visible or accessible via click.

### Typography
- **Font Family:** [Geist](https://vercel.com/font) (Default Next.js font) or a similar clean Sans-Serif.
- **Readability:** High contrast dark grey text on white/light backgrounds.

## Layout Principles
- **Spacing:** Generous whitespace to maintain a "clean" look.
- **Grid:** Responsive grid layout for product catalogs.
- **Imagery:** High-quality flower photography is central to the design.

## Iconography

We use a small, consistent icon system across the UI to improve affordance and visual hierarchy for actions and navigation.

- Library: `lucide-react` (TypeScript-friendly, lightweight, tree-shakeable, Tailwind- and Next.js-friendly). Re-export common icons from `src/components/ui/icons.tsx` so consumers import from a single place.
- When to use: Navigation items, primary call-to-action buttons, cart link, mobile menu toggles & inline affordances (e.g., search, back, info). Do NOT use icons when the meaning becomes unclear without the text.
- Sizes & tokens:
  - Use `h-4 w-4` for small inline icons (nav items, labels).
  - Use `h-5 w-5` for larger CTAs when needed.
  - All icon classes should be centralized via `IconSizeClass` in the icons helper file.
- Placement rules:
  - Navigation & CTAs: icon on the left (leading), 8px (Tailwind `mr-2`) spacing to keep visual rhythm.
  - Secondary actions which augment text may use an icon on the right (e.g., chevrons for disclosure).
- Accessibility:
  - Decorative icons should have `aria-hidden="true"` and be accompanied by textual labels.
  - When an icon conveys dynamic information (e.g., cart item count), announce via `aria-live` regions or include the count in an `aria-label` on the interactive element.

Example usage:

  - `src/components/site/Nav.tsx` — icons appear left of labels and the mobile menu toggle uses `Menu`/`X` icons.
  - `src/app/page.tsx` — primary CTA `Shop bouquets` includes a `ShoppingBag` icon to reinforce the action.

