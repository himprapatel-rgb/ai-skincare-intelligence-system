# Task 10001: Mobile App Feel – Remaining Gaps

**Status:** In Progress  
**Sprint:** GUI Polish  
**Parent:** Task 10000 (Mobile App Look)

## Implemented (Phase 1)

- **mobile-app-polish.css** – New stylesheet for Task 10001
- A1–A5: Header, padding, bottom nav, overflow, content width
- C1–C4: Card styling, list rows, empty states
- E1–E2: Primary buttons, opacity-only tap feedback (no transform)
- F1, F4, F7: Home hero CTA, My Shelf cards, Auth form

## Implemented (Phase 2)

- **B1**: Page transitions – fade-in on route change (AppLayout page-transition-wrap)
- **G1**: Modal styling – bottom-sheet feel, drag handle, safe-area padding (ConfirmModal, ConsentModal)
- **F2**: Scan page – consistent padding
- **F3**: Product Scanner – padding, mode selector touch-friendly
- **F5**: Product Details – padding, single-column header on mobile
- **F6**: Dashboard – padding, stats layout
- **F8**: Profile/Settings – full-width container, edge-to-edge on mobile

---

## What’s Done (Task 10000)

- PWA manifest, icons, splash
- Meta tags, viewport, safe areas
- Add to Home Screen prompt
- Overscroll-behavior, touch-action
- Bottom nav, 100dvh

---

## Remaining Tasks (by priority)

### A. Layout & chrome (global)

| #  | Task | Description |
|----|------|-------------|
| A1 | **Header** | Sticky header that feels like an app bar (fixed height, clear elevation, maybe shrink on scroll) |
| A2 | **Page padding** | Consistent horizontal padding (e.g. 16px) across all pages on mobile |
| A3 | **No horizontal scroll** | Audit all pages for overflow-x, ensure no side scroll |
| A4 | **Bottom nav styling** | Stronger elevation, clearer active state, optional haptic-style feedback |
| A5 | **Content max-width** | Keep content centered and readable on large phones |

---

### B. Navigation & transitions

| #  | Task | Description |
|----|------|-------------|
| B1 | **Page transitions** | Use View Transitions API or simple fade/slide between routes |
| B2 | **Swipe-back (iOS)** | Optional swipe-from-edge to go back (where supported) |
| B3 | **Back button** | Consistent back behavior and placement on inner pages |
| B4 | **Loading state** | Route-change loading indicator instead of full blank screen |

---

### C. Cards & lists

| #  | Task | Description |
|----|------|-------------|
| C1 | **Card styling** | Rounded corners (12–16px), consistent shadow, padding on mobile |
| C2 | **List rows** | Min 44px height, clear tap area, optional row swipe actions |
| C3 | **Product cards** | Touch-friendly product cards on My Shelf and elsewhere |
| C4 | **Empty states** | Illustrated or branded empty states instead of plain text |

---

### D. Forms & inputs

| #  | Task | Description |
|----|------|-------------|
| D1 | **Input styling** | Full-width, clear focus state, proper label/placeholder |
| D2 | **Touch targets** | Min 44px height on buttons and inputs |
| D3 | **Keyboard handling** | Avoid inputs being covered by keyboard; scroll into view when focused |
| D4 | **Date/number inputs** | Use native date/number pickers on mobile where possible |

---

### E. Buttons & touch feedback

| #  | Task | Description |
|----|------|-------------|
| E1 | **Primary buttons** | Large, full-width on mobile where appropriate |
| E2 | **Tap feedback** | Opacity-only `:active` (no transform) to avoid blank screen issues |
| E3 | **Disabled state** | Clear visual difference for disabled buttons |
| E4 | **Loading states** | Spinner or skeleton on buttons during submit/load |

---

### F. Page-specific polish

| #  | Task | Page(s) |
|----|------|---------|
| F1 | **Home hero** | Responsive hero, CTAs sized for touch |
| F2 | **Scan page** | Camera UI, clear scan zone and controls |
| F3 | **Product Scanner** | Barcode/photo UI, manual entry, results layout |
| F4 | **My Shelf** | Card grid, filters, actions, ratings |
| F5 | **Product Details** | Tabs, sections, add-to-shelf flow |
| F6 | **Dashboard** | Charts, cards, layout on small screens |
| F7 | **Auth (Login/Register)** | Form layout, social buttons, validation UI |
| F8 | **Profile/Settings** | List sections, toggles, clear hierarchy |

---

### G. Modals & overlays

| #  | Task | Description |
|----|------|-------------|
| G1 | **Modal styling** | Full-screen or near full-screen on mobile; clear close affordance |
| G2 | **Bottom sheet** | Use bottom sheet for filters/options instead of dropdowns where possible |
| G3 | **Toast/snackbar** | Positioned above bottom nav, auto-dismiss, readable |

---

### H. Performance & polish

| #  | Task | Description |
|----|------|-------------|
| H1 | **Skeleton loaders** | Replace spinners with skeletons on key views |
| H2 | **No layout shift** | Avoid CLS when content loads |
| H3 | **Smooth scroll** | Consistent scroll behavior, optional scroll snap |
| H4 | **Share integration** | Web Share API for sharing products/reports where useful |

---

### I. Optional / future

| #  | Task | Description |
|----|------|-------------|
| I1 | **Pull-to-refresh** | On Shelf, Dashboard (without breaking overscroll) |
| I2 | **More splash sizes** | Extra iPhone sizes for startup image |
| I3 | **Service worker** | Basic offline caching |
| I4 | **Haptics** | Vibration API for key actions (where supported) |

---

## Suggested order

1. **A1–A5** – Global layout and chrome
2. **C1–C4** – Cards and lists (affects many pages)
3. **E1–E2** – Buttons and tap feedback (opacity only)
4. **F1, F4, F7** – Home, My Shelf, Auth
5. **B1, G1** – Transitions and modals
6. **F2, F3, F5, F6, F8** – Remaining pages
7. **H1–H4** – Performance and polish

---

## Notes

- Avoid `transform` in `:active` styles (previously caused blank screen).
- Prefer opacity-only tap feedback where needed.
- Test on real devices (iOS Safari, Android Chrome).
- Run `npm run e2e:mobile-app` after changes.
