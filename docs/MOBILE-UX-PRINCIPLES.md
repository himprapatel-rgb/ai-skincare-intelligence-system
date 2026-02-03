# Mobile UX Principles

One-pager for design and development: how we make the mobile experience feel like a native app.

**Scope:** Viewport ≤768px; PWA/standalone when installed.

---

## 1. App-like structure

- **One primary action per screen**  
  Each page has a single clear primary CTA where possible (e.g. “Take your first scan”, “Add product”). Avoid multiple competing buttons.

- **Consistent page shell**  
  Every mobile page uses:
  - Root: `app-page`
  - Optional header: `app-header-card` with `app-header-subtitle` for the tagline
  - Content: `app-page-content` (safe-area padding and max-width handled here)

- **Bottom navigation**  
  Primary tabs (Home, Scan, Dashboard, Shelf, Profile) live in the fixed bottom nav. Deep links (e.g. Product, Analysis) use back or app header; don’t duplicate tab bar.

---

## 2. Safe areas and chrome

- **Notches and home indicator**  
  Use `env(safe-area-inset-*)` for padding. Bottom nav and FAB sit above the safe-area bottom so they’re not covered.

- **No horizontal scroll**  
  Content stays within the viewport. Use `overflow-x: hidden` on the main scroll container and avoid fixed widths that exceed 100vw.

- **Standalone mode**  
  When the app is run from the home screen (`display-mode: standalone` or `data-standalone="true"`), apply extra top padding so content clears the status bar.

---

## 3. Touch and interaction

- **Touch targets ≥44×44px**  
  Buttons, links, and list row actions meet this minimum so they’re easy to tap without mistakes.

- **Tap feedback**  
  Use a subtle `-webkit-tap-highlight-color` or a brief scale/opacity change so the user sees that their tap was registered.

- **Inputs**  
  Use at least 16px font size on inputs to avoid iOS zoom-on-focus.

---

## 4. Content hierarchy

- **One H1 per page**  
  The main heading is in the `app-header-card` (or equivalent). Don’t repeat the same title in nav and content.

- **Cards and lists**  
  Use a consistent radius (e.g. 14px) and spacing. Prefer `app-card` and list rows with a clear primary action (e.g. “View”) and optional overflow menu.

- **Empty states**  
  Use the shared `EmptyState` component: icon, short title, one line of copy, and one primary CTA.

---

## 5. Errors and loading

- **Page-level errors**  
  Use the shared `ErrorCard`: icon, title, message, and one primary recovery action (e.g. “Retry” or “Go back”). Avoid long error text or multiple actions.

- **Loading**  
  Prefer skeleton layouts that match the final content (list rows, cards) over a single spinner where it makes sense.

- **Inline validation**  
  Show field-level errors next to the control; keep page-level errors for real failures.

---

## 6. Accessibility

- **Focus**  
  All interactive elements get a visible focus ring with `:focus-visible` (keyboard/screen reader users).

- **Motion**  
  Respect `prefers-reduced-motion: reduce`: disable or shorten animations so the app stays usable.

- **Status**  
  Don’t rely on color alone for success/error/warning; add icon or text.

---

## 7. Performance and PWA

- **First load**  
  Routes are lazy-loaded so the initial bundle stays small. Scan/camera and heavy libs load only when needed.

- **Install**  
  Manifest has `short_name`, `theme_color`, and icons (192, 512). “Add to Home Screen” is prompted when appropriate and doesn’t block content.

- **Offline**  
  Static assets are cached by the service worker. Define what works offline (e.g. cached analysis) and what requires network (e.g. new scan).

---

## Breakpoint and tokens

- **Mobile breakpoint:** `768px` (max-width). Use `var(--breakpoint-mobile)` or `768px` in CSS; keep a single breakpoint for “mobile” so behavior is consistent.

- **Spacing:** Prefer tokens `--space-2` (8px), `--space-4` (16px), `--space-6` (24px) for padding and gaps in `app-page-content` and between sections.

- **Radius:** Use `--radius-lg` (12px) for cards and list groups on mobile.

---

## Acceptance criteria (checklist for mobile stories)

For every mobile-facing change, confirm:

- [ ] **Viewports:** Works on 375px and 414px width (and 768px if applicable).
- [ ] **Touch targets:** All tappable elements are at least 44×44px.
- [ ] **No horizontal scroll:** Content does not overflow horizontally.
- [ ] **Structure:** Page uses `app-page` and, where appropriate, `app-header-card` + `app-page-content`.
- [ ] **Focus:** New interactive elements have a visible `:focus-visible` state.
- [ ] **Reduced motion:** Any new animation is disabled or shortened when `prefers-reduced-motion: reduce`.

Use this checklist in PRs and when writing tickets so design and dev stay aligned.
