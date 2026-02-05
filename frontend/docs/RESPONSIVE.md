# Responsive Design System

Desktop, tablet, and mobile are **separate**: each viewport has its own CSS file and clearly labeled blocks.

## File separation

| File | Purpose |
|------|--------|
| `src/styles/responsive-base.css` | Variables, shared utilities (no viewport media) |
| `src/styles/responsive-mobile.css` | **Mobile only** – `max-width: 768px` |
| `src/styles/responsive-tablet.css` | **Tablet only** – `769px–1024px` |
| `src/styles/responsive-desktop.css` | **Desktop only** – `min-width: 1025px` |

In `AppLayout.css` and `design-system.css`, viewport blocks are labeled with `/* ---------- MOBILE ---------- */`, `/* ---------- TABLET ---------- */`, `/* ---------- DESKTOP ---------- */` (or `TABLET + MOBILE` where both share a rule).

## Breakpoints

| Viewport | Width        | Use |
|----------|--------------|-----|
| **Mobile**  | ≤ 768px   | Single column, bottom nav, 44px touch targets, safe areas |
| **Tablet**  | 769px – 1024px | Balanced padding, desktop nav, 48px tap targets where appropriate |
| **Desktop** | ≥ 1025px  | Full layout, max content width 1280px |

Values are kept in sync with:

- **JS/TS:** `src/constants/viewport.ts` (`MOBILE_MAX`, `TABLET_MAX`, `DESKTOP_MIN`)
- **CSS:** `src/styles/responsive-base.css` (`--r-mobile-max`, `--r-tablet-min`, etc.); viewport rules in `responsive-mobile.css`, `responsive-tablet.css`, `responsive-desktop.css`
- **Layout:** `AppLayout` sets `data-viewport="mobile"|"tablet"|"desktop"` on the root layout div

## CSS Utilities (`responsive.css`)

- **Containers:** `.r-container`, `.r-container--narrow`, `.r-container--wide` (responsive padding)
- **Visibility:** `.r-show-mobile`, `.r-show-tablet`, `.r-show-desktop`, `.r-hide-mobile`, `.r-hide-tablet`, `.r-hide-desktop`
- **Grids:** `.r-grid--2`, `.r-grid--3`, `.r-grid--4`, `.r-grid--auto` (responsive columns)
- **Touch & safe area:** `.r-touch` (min 44×44px), `.r-safe-top`, `.r-safe-bottom`, `.r-safe-x`, `.r-safe-y`
- **Overflow:** `.r-contain`, `.r-contain-content` (no horizontal scroll, word-break)

## Standards Applied

- **No horizontal scroll** on any viewport; `overflow-x: hidden` and `max-width: 100%` on key wrappers.
- **Minimum 44×44px** touch targets on mobile (WCAG 2.5.5); tablet can use 48px for primary actions.
- **Safe area insets** for notched devices (`env(safe-area-inset-*)`).
- **Mobile-first** where possible: base styles for small screens, `min-width` media queries for tablet/desktop.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` respected in `responsive-base.css` and global styles.

## Using the viewport in React

```ts
import { useViewport } from '../hooks/useViewport';

const viewport = useViewport(); // 'mobile' | 'tablet' | 'desktop'
```

Use for conditional rendering (e.g. bottom nav only on mobile) or to pass `data-viewport` is already set by `AppLayout`.
