# Task 1000: Design & Mobile App – Master Task

**Status:** Implemented  
**Sprint:** GUI Polish / Mobile Experience  
**Priority:** High  
**Parent:** None (umbrella task)

## Implementation Summary (Complete)

| Category | Status | Notes |
|----------|--------|-------|
| **DS** Design tokens | Done | index.css, design-system.css |
| **ML** Mobile layout | Done | mobile-app-polish.css |
| **TS** Touch & scroll | Done | Splash pointer-events, no touch-action blocking |
| **CO** Components | Done | Cards, buttons, inputs, modals, toasts |
| **PP** Page polish | Done | All pages: 16px padding, single-column grids |
| **PW** PWA | Done | manifest, icons, splash, Add to Home Screen |
| **PF** Performance | Done | Skeleton loaders, page transitions |

**New file:** `frontend/src/styles/task-1000-design-mobile.css` – focus states, 480px breakpoint, page-specific grids

---

## Overview

Task 1000 is an umbrella task for **design system refinement** and **mobile app experience** across the SkinCareAI web application. It consolidates visual consistency, touch-friendly UI, responsive layout, and app-like behavior when used in a mobile browser or as an installed PWA.

---

## Scope

| Area | Description |
|------|-------------|
| **Design System** | Typography, spacing, colors, shadows, borders, component tokens |
| **Mobile Layout** | Responsive breakpoints, safe areas, bottom nav, header |
| **Touch & Scroll** | Tap targets, gestures, scroll behavior, no-blocking overlays |
| **Pages & Components** | Per-page polish, cards, forms, modals, empty states |
| **PWA & Install** | Manifest, icons, splash, Add to Home Screen |

---

## Sub-tasks by Category

### 1. Design System (DS)

| ID | Task | Description |
|----|------|-------------|
| DS1 | **Typography scale** | Consistent font sizes, weights, line-heights across breakpoints |
| DS2 | **Spacing tokens** | 4/8/12/16/24/32/48px scale, use CSS variables |
| DS3 | **Color tokens** | Primary, secondary, success, warning, danger; ensure contrast (WCAG) |
| DS4 | **Shadow elevation** | sm, md, lg, xl for cards, modals, dropdowns |
| DS5 | **Border radius** | 8/12/16/20px tokens; consistent card/button radius |
| DS6 | **Focus states** | Visible focus ring for keyboard users, 2px outline |

---

### 2. Mobile Layout (ML)

| ID | Task | Description |
|----|------|-------------|
| ML1 | **Breakpoints** | 480, 768, 1024, 1280px; mobile-first approach |
| ML2 | **Safe areas** | env(safe-area-inset-*) for notched devices |
| ML3 | **Page padding** | 16px horizontal on mobile; max(16px, safe-area) |
| ML4 | **Header** | Sticky, 56px min-height on mobile, clear elevation |
| ML5 | **Bottom nav** | Fixed, above safe-area, 5 items, active state |
| ML6 | **Content scroll** | overflow-y: auto on main; -webkit-overflow-scrolling: touch |

---

### 3. Touch & Scroll (TS)

| ID | Task | Description |
|----|------|-------------|
| TS1 | **Touch targets** | Min 44x44px for buttons, links, nav items |
| TS2 | **Tap feedback** | Opacity-only :active (avoid transform – can break scroll) |
| TS3 | **No scroll blocking** | Splash/overlays: pointer-events: none where appropriate |
| TS4 | **No touch-action override** | Avoid touch-action: manipulation on scroll containers |
| TS5 | **Smooth scroll** | scroll-behavior: smooth; optional scroll-snap |

---

### 4. Components (CO)

| ID | Task | Description |
|----|------|-------------|
| CO1 | **Cards** | 12px radius, consistent shadow, 16px padding on mobile |
| CO2 | **Buttons** | 48px min-height, full-width on mobile where appropriate |
| CO3 | **Inputs** | 48px min-height, 16px font-size (prevent iOS zoom), clear focus |
| CO4 | **Modals** | Bottom-sheet style on mobile; drag handle, safe-area |
| CO5 | **Toasts** | Above bottom nav; 16px horizontal margin |
| CO6 | **Empty states** | Centered, icon + heading + CTA |

---

### 5. Page Polish (PP)

| ID | Task | Pages |
|----|------|-------|
| PP1 | **Home** | Hero, CTAs, trust badges, responsive |
| PP2 | **Auth** | Form layout, social buttons, validation UI |
| PP3 | **Scan / Analysis** | Camera UI, results layout, skeleton loaders |
| PP4 | **Product Scanner** | Barcode/photo modes, mode selector, results |
| PP5 | **My Shelf** | Product grid, filters, add-to-shelf flow |
| PP6 | **Product Details** | Single-column on mobile, tabs, add-to-shelf |
| PP7 | **Dashboard** | Stats grid, charts, cards |
| PP8 | **Profile/Settings** | Hero, sidebar → horizontal tabs, forms |
| PP9 | **Recommendations** | Grid, filters, add-to-shelf |
| PP10 | **All remaining** | About, Contact, History, Favorites, Admin, etc. |

---

### 6. PWA & Install (PW)

| ID | Task | Description |
|----|------|-------------|
| PW1 | **Manifest** | display: standalone, icons, categories |
| PW2 | **Icons** | 192x192, 512x512; maskable + any |
| PW3 | **Splash** | Startup image for iOS; inline splash with pointer-events: none |
| PW4 | **Add to Home Screen** | Prompt above bottom nav; dismiss for 7 days |

---

### 7. Performance & Polish (PF)

| ID | Task | Description |
|----|------|-------------|
| PF1 | **Skeleton loaders** | Replace spinners on key views (Product, Analysis, Digital Twin) |
| PF2 | **Page transitions** | Fade-in on route change; RouteLoadingBar |
| PF3 | **No layout shift** | Min-height on skeletons; reserve space |
| PF4 | **Optimistic UI** | Button loading state; disable during submit |

---

## Implementation Order (Suggested)

1. **DS1–DS6** – Design tokens (foundation)
2. **ML1–ML6** – Mobile layout
3. **TS1–TS5** – Touch & scroll (critical for mobile)
4. **CO1–CO6** – Component styling
5. **PP1–PP10** – Page polish
6. **PW1–PW4** – PWA (if not done)
7. **PF1–PF4** – Performance polish

---

## Related Tasks

| Task | Description |
|------|-------------|
| **Task 10000** | Mobile App Look (PWA, manifest, icons, splash) |
| **Task 10001** | Mobile App Feel – remaining gaps |

---

## Notes

- Avoid `transform` in `:active` styles – can cause blank screen on some mobile browsers.
- Test on real devices: iOS Safari, Android Chrome.
- Run `npm run e2e:mobile-app` after changes.
- Use `mobile-app-polish.css` for mobile-specific overrides.

---

## Acceptance Criteria (Overall)

- [ ] All pages responsive at 390px viewport
- [ ] No horizontal scroll
- [ ] Touch targets ≥ 44px
- [ ] Scroll and tap work reliably
- [ ] Consistent 16px page padding
- [ ] Cards, buttons, inputs follow design tokens
- [ ] Modals use bottom-sheet style on mobile
- [ ] Skeleton loaders on main loading views
