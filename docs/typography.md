# Typography utilities

This document describes the new reusable heading utilities added to `src/app/globals.css`.

## Classes added

- `heading-1` — largest (page titles)
- `heading-2` — section titles
- `heading-3` — subsection titles
- `heading-4` — smaller headings
- `heading-5` — compact headings
- `heading-6` — smallest heading style

Each class is responsive and uses the project's `font-serif` utility for a refined heading style. They provide consistent font-size, line-height, letter-spacing and weight across the app.

## Usage

Use the classes on semantic heading elements for accessibility and SEO:

```tsx
<h1 className="heading-1">Main page title</h1>
<h2 className="heading-2">Section title</h2>
<h3 className="heading-3">Subsection</h3>
```

## Component helpers

There are also small React wrapper components available at `src/components/ui/typography.tsx` for quick use across the codebase (H1..H6).

## Notes
- These utilities are intentionally light-theme only per the project's style guide. No dark-mode-specific heading variants were added.
