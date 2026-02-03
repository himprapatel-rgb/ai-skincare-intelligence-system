# Mobile Home Page Audit

**Scope:** Home route at `/` when viewport is mobile (≤768px). Rendered component: **TodayPage** (see `HomeRoute.tsx`).

**Audit date:** February 2025

---

## 1. Overview

- **Route:** `"/"` → `HomeRoute` → `TodayPage` when `useViewport() === 'mobile'`.
- **Breakpoint:** Mobile = `max-width: 768px` (from `constants/viewport.ts`).
- **Layout:** App shell (header + main + bottom nav). Bottom nav is fixed; main has `padding-bottom` for clearance (~96px + safe area).
- **Page class:** `today-page app-page`.

---

## 2. Structure & Content

| Section | Purpose | Auth |
|--------|---------|------|
| Header | Greeting ("Good morning, {name}"), region pill (🇮🇪), NotificationBell, Settings link | Yes |
| Guest state | Single card: "Sign in to see your skin score…" + Sign in / Try a free scan | No |
| Prediction card | "Your skin's future" – 30-day score prediction, link to Digital Twin | If score > 0 |
| Your skin today | Gauge, trend, scan count, "Last: …", New Scan / History, Digital Twin intro/link | Yes |
| Your top concerns | 2×2 grid of concern chips (HIGH/MED/LOW) | Yes |
| AI ingredient match | Recommended ingredients + "Find matching products" | Yes |
| Your progress | Mini before/after (Day 1 → Today) when twin snapshots exist | If snapshots > 0 |
| Morning/Evening routine | Tabs, progress bar, step list with checkboxes, Edit routine link | Yes |
| Streak card | N-day streak + week labels (when streak > 0) | Yes |
| Recommended for you | Horizontal scroll of 3 product cards, "Buy on Amazon" | Yes |
| CTA card | "Add products to your shelf…" when shelf is empty | Yes |

---

## 3. Findings

### 3.1 Critical / Bugs

- **Last scan date not set (fixed)**  
  "Last: …" under the skin score used `lastScanDate` state, which was never set from the scan history response. The backend returns `created_at` per scan. **Fix:** In the same `useEffect` that fetches scan history, set `lastScanDate` from the most recent completed scan’s `created_at` (e.g. `completed[0].created_at`).

### 3.2 High Priority

- **Top concerns are static**  
  "Your top concerns" uses `TOP_CONCERNS_FALLBACK` (Dark Circles, Dehydration, etc.). It does not reflect the user’s latest analysis or digital twin. **Recommendation:** Drive this from the latest scan summary or digital twin concerns when available; keep fallback for new users.

- **Region pill is hardcoded**  
  Header shows "🇮🇪" as a region pill. There is no geo detection or user preference. **Recommendation:** Replace with real region (e.g. from IP/locale or user setting) or remove until implemented.

### 3.3 Medium Priority

- **Product images missing**  
  `RECOMMENDED_PRODUCTS` has `imageUrl: null`; cards show a "Product" placeholder. **Recommendation:** Use real product images (e.g. from catalog or affiliate API) when available.

- **Duplicate bottom nav semantics**  
  AppLayout shows a mobile hamburger nav (Home, Scan, Dashboard, etc.) and a separate **BottomNav** (Today | Scan | Me). On `/`, both "Home" in the menu and "Today" in the bottom nav point to the same page. **Recommendation:** Ensure labels and `aria-current` are consistent; consider hiding or simplifying the hamburger on the home route if redundant.

- **Reduced motion**  
  Global `prefers-reduced-motion` in `app-mobile-global.css` shortens transitions/animations. The skin score gauge uses `transition: stroke-dashoffset 0.8s`; it should still respect reduced motion. **Recommendation:** Add a reduced-motion media query for the gauge (e.g. shorter or no transition).

### 3.4 Low Priority / Polish

- **Illustration sizing**  
  SVG illustrations use classes like `today-ill-section` (32px), `today-ill-btn` (24px). They are inline SVGs from the Illustrations component library. **Status:** Sizing is consistent; no change required unless design updates.

- **Guest header**  
  When not authenticated, the header only shows "Your skin today" (no region pill or settings). **Status:** Acceptable; consider adding a "Sign in" or "Settings" entry point for consistency.

- **Horizontal scroll affordance**  
  "Recommended for you" and product cards use horizontal scroll with `scroll-snap-type: x mandatory`. **Status:** Works; optional improvement: subtle gradient or fade at the end to hint at more content.

---

## 4. Layout & CSS

- **Safe areas:**  
  - Header: `padding-top: max(12px, env(safe-area-inset-top))`, horizontal `max(16px, env(safe-area-inset-*))`.  
  - Page: `padding-bottom: 96px` in `TodayPage.css`; global mobile overrides add `max(108px, 96px + env(safe-area-inset-bottom))` for `.app-page`.  
  - Bottom nav: `padding-bottom: max(12px, env(safe-area-inset-bottom))`.

- **Touch targets:**  
  Buttons and nav items meet min height 44px in `app-mobile-global.css`. Routine step buttons and primary/secondary buttons on the page comply.

- **Content width:**  
  `.today-content` uses `max-width: 520px` and `margin: 0 auto` for readability on larger phones.

- **Bottom nav overlap:**  
  Content has sufficient bottom padding so the fixed bottom nav does not cover the last card or CTAs.

---

## 5. Accessibility

- **Headings:**  
  Page has a single `<h1>` (greeting). Section titles use `<h2>`. Structure is logical.

- **Links:**  
  "See full prediction", "View full analysis & timeline", "Edit routine", "Find matching products", "Buy on Amazon" are proper links with visible text. Settings is a link with `aria-label="Settings"`.

- **Gauge:**  
  The skin score SVG has `role="img"` and `aria-label={`Skin score ${data.skinScore} out of 100`}`. **Status:** Good.

- **Illustrations:**  
  Illustration components set `aria-hidden` (decorative). **Status:** Good.

- **Routine steps:**  
  Step buttons use `aria-pressed={completedSteps.has(index)}`. **Status:** Good.

- **Focus:**  
  Global focus-visible styles use `outline: 2px solid var(--primary)` and offset. No focus traps identified.

---

## 6. Performance

- **Data loading:**  
  Scan history and digital twin snapshot count are fetched when authenticated. No obvious over-fetch; twin query uses `limit=200` which may be high if only count is needed for this page.

- **Images:**  
  Product cards use placeholder when `imageUrl` is null; no lazy-load issue. Illustration SVGs are inlined via the component library (no extra network requests for icons).

- **Viewport:**  
  `useViewport()` uses `matchMedia` and updates on resize. Initial render uses `getViewport()` (client-only). No SSR mismatch because the app is client-rendered.

---

## 7. Recommendations Summary

| Priority | Item | Action |
|----------|------|--------|
| Done | Last scan date | Set `lastScanDate` from scan history `created_at` in TodayPage. |
| High | Top concerns | Source from latest analysis/digital twin; keep fallback. |
| High | Region pill | Implement geo or user region, or remove pill. |
| Medium | Product images | Populate `imageUrl` from catalog/affiliate when available. |
| Medium | Reduced motion | Apply to gauge transition (and any other decorative motion). |
| Low | Guest header | Optional: add Sign in / Settings for consistency. |
| Low | Scroll hint | Optional: visual hint for horizontal scroll on recommendations. |

---

## 8. Files Referenced

- `frontend/src/components/HomeRoute.tsx` – route switch (mobile → TodayPage).
- `frontend/src/pages/TodayPage.tsx` – home dashboard logic and JSX.
- `frontend/src/pages/TodayPage.css` – page-specific styles.
- `frontend/src/components/AppLayout.tsx` – shell, header, main, BottomNav.
- `frontend/src/components/BottomNav.tsx` – 3-tab nav (Today | Scan | Me).
- `frontend/src/hooks/useViewport.ts` – mobile/tablet/desktop.
- `frontend/src/constants/viewport.ts` – breakpoints (768, 1024).
- `frontend/src/styles/app-mobile-global.css` – mobile padding, touch targets, safe area.
