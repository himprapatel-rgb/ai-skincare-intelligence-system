# Mobile GUI Test Report Fixes (Feb 3, 2026)

Addresses issues from the Pellicura/SkinCareAI mobile GUI test (iPhone 5 emulator, pellicura.com).

---

## Critical

### 1. Menu overlay transparency
- **Fix:** Mobile menu is now a **solid opaque panel** (`background: #ffffff`) from `top: 56px` to bottom, with `z-index: 9999`. Backdrop remains `z-index: 9998`. Menu no longer uses transparency so page content cannot bleed through.

### 2. FAB overlaps navigation bar
- **Fix:** **Home page:** Removed the floating “Start Free Skin Scan” CTA so there is a **single primary CTA** (hero button only). This removes the duplicate CTA and the overlapping FAB on home. Other pages: BackToTop and similar FABs already use `bottom: 96px` (+ safe area) so they sit above the bottom nav.

### 3. Teal loading indicator overlaps UI
- **Fix:** **RouteLoadingBar** (top progress bar): added `pointer-events: none` so it does not capture clicks or obscure interaction. Bar remains at the very top (3px height). If a different “teal dot” loader appears over content, it is likely an inline/Suspense loader and would need to be scoped to the loading container.

---

## Major

### 4. Home – duplicate CTA
- **Fix:** Floating CTA removed on home. Only the hero “Start Free Skin Scan” button is shown.

### 5. Scan page – text truncation
- **Fix:** `.scan-upload-hint` now uses `white-space: normal`, `word-wrap: break-word`, `max-width: 100%`, `text-align: center` so “JPG, PNG, or WEBP (Max 10MB)” and “Face only: close-up selfie…” wrap and stay visible.

### 6. Dashboard – no page header
- **Fix:** `.dashboard-hero` given `min-height: 72px` so the “Welcome back” header block is always visible and not collapsed on small viewports.

### 7. Shelf – filter tab truncation
- **Fix:** `.myshelf-pills` given `padding-right: 8px` so the last filter pill (e.g. “Done”) remains visible when scrolling horizontally.

### 8. Profile – Password word break
- **Fix:** `.settings-label` set to `white-space: nowrap` with `overflow: hidden` and `text-overflow: ellipsis` so “Password” (and other labels) do not break mid-word.

### 9. Digital Twin – “TOP CONCERNS” truncation
- **Fix:** `.dt-stat-value` given `word-wrap: break-word`, `overflow-wrap: break-word`, `min-width: 0` so concern text (e.g. “Dark Circles, Dehydration, Uneven Texture”) wraps instead of being cut off.

### 10. Features menu – “Routine Builder” cut off
- **Fix:** `.app-nav-mobile-scroll` already has `padding-bottom: max(100px, calc(80px + env(safe-area-inset-bottom)))` so menu content can scroll above the bottom nav. Menu panel is full-height (`top: 56px; bottom: 0`).

---

## Not changed (data / product)

- **Shelf duplicate product / invalid data:** Duplicate “Epiduo Gel” or “Black Peppercorn Grinder” are **data/API or test data** issues, not layout fixes. Handle in backend or seed data.
- **Branding (SkinCareAI vs pellicura.com):** Product/domain decision; no code change.
- **Navigation bar active state:** Current active state uses color and font-weight only (no teal circle). If a different build showed a circle obscuring the icon, re-test after these fixes.

---

## Files touched

- `frontend/src/components/AppLayout.css` – menu overlay, z-index, full-height panel
- `frontend/src/components/RouteLoadingBar.css` – pointer-events
- `frontend/src/pages/HomePage.tsx` – remove floating CTA
- `frontend/src/pages/HomePage.css` – floating CTA styles / padding
- `frontend/src/pages/ScanPage.css` – upload hint wrap
- `frontend/src/pages/DashboardPage.css` – hero min-height
- `frontend/src/pages/MyShelfPage.css` – pills padding-right
- `frontend/src/pages/ProfileSettingsPage.css` – settings-label nowrap
- `frontend/src/components/digital-twin/styles/digital-twin.css` – dt-stat-value wrap
