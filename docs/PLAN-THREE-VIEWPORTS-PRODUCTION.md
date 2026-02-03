# Plan: Three Viewport Code Paths — Production Clarity & Optimization

**Goal:** Make desktop / tablet / mobile three **explicit, maintainable code paths** so the app reads like real production and stays performant.

---

## 1. Three code paths (locked in)

| Viewport | Width | Layout | Entry / behavior |
|----------|--------|--------|-------------------|
| **Desktop** | ≥ 1025px | Full site: header, full nav, full footer, max-width content. | `/` → HomePage. No app shell. |
| **Tablet** | 769px – 1024px | Own path: same as desktop today; can get tablet-specific nav/layout later. | `/` → HomePage. No app shell. |
| **Mobile** | ≤ 768px | App shell: minimal header, bottom nav (TODAY / Scan / Me), no hamburger, safe areas. | `/` → TodayPage. App shell only on app routes. |

**Rules:**

- One source of truth for breakpoints: `frontend/src/constants/viewport.ts` (used by `useViewport`, CSS stays in sync via comments).
- Layout decisions use `useViewport()` (or `useIsMobile()` when only mobile vs non-mobile). No ad-hoc `window.innerWidth` for layout.
- Every UI change: decide which viewport(s) it applies to; use `data-viewport` in CSS when you need viewport-specific styles.

---

## 2. File and structure conventions (production clarity)

### 2.1 What we have today (keep)

- `useViewport()` → `'desktop' | 'tablet' | 'mobile'`
- `AppLayout` sets `data-viewport={viewport}` on root
- `HomeRoute`: mobile → TodayPage, tablet/desktop → HomePage
- App shell (minimal header + bottom nav) only when `viewport === 'mobile'` and path is in `appPaths`

### 2.2 Single source of truth for breakpoints

- **Add:** `frontend/src/constants/viewport.ts`  
  - Exports `VIEWPORT_BREAKPOINTS` (e.g. `MOBILE_MAX = 768`, `TABLET_MAX = 1024`) and `Viewport` type.
- **Use in:** `useViewport.ts` (import breakpoints from constants).
- **CSS:** Keep using 768px / 1024px / 1025px; document in constants that “CSS breakpoints must match constants” (see PROTOCOL-VIEWPORT-SPLIT.md).

### 2.3 Where viewport-specific code lives

| Concern | Where it lives | Rule |
|--------|-----------------|------|
| **Routing** | `HomeRoute.tsx`, `App.tsx` | HomeRoute branches on viewport; other routes shared. |
| **Layout** | `AppLayout.tsx` + `AppLayout.css` | One layout component; behavior via `data-viewport` and viewport checks. |
| **Nav** | `BottomNav.tsx` (mobile), header nav (desktop/tablet) | Shown/hidden in AppLayout by viewport. |
| **Page content** | Same page components | Pages can branch inside with `useViewport()` or use CSS `[data-viewport="..."]`. |
| **Styles** | `AppLayout.css`, `app-mobile-global.css`, page CSS | Prefer `[data-viewport="mobile"]` etc. over raw media queries when the rule is “only on this viewport”. |

We do **not** split into three separate apps or three separate bundles; we keep one app with three **logical** code paths and clear conventions.

### 2.4 Naming and comments

- In components that branch on viewport: add a one-line comment, e.g. `// Mobile: bottom nav; desktop/tablet: full nav.`
- In CSS: keep the block comment in `AppLayout.css` that lists desktop / tablet / mobile and `data-viewport`.

---

## 3. Production checklist (clear like real production)

Use this when touching layout or adding features:

- [ ] **Breakpoints** — All breakpoints come from `constants/viewport.ts` (or match it in CSS).
- [ ] **Layout** — No new layout logic that assumes “mobile and desktop only”; tablet is explicit.
- [ ] **App shell** — Only when `viewport === 'mobile'` and route is in app paths.
- [ ] **Safe areas** — Mobile pages use `env(safe-area-inset-*)` for padding; no content under notch/home indicator.
- [ ] **Touch** — Mobile: 44px min touch targets; 16px input font to avoid zoom.
- [ ] **Tests** — Any new viewport-specific behavior has a test (e.g. HomeRoute renders Today on mobile, Home on desktop).

---

## 4. Optimization

### 4.1 Bundle and loading

- **Lazy routes** — Already in place (React.lazy per page). Keep it.
- **Chunks** — Already split (e.g. mediapipe, tensorflow, recharts). Add viewport-specific heavy screens to `manualChunks` only if they are large (e.g. scanner, digital-twin).
- **Initial load** — Critical path: AppLayout, HomeRoute, useViewport, one layout. Avoid loading desktop-only or tablet-only heavy code on mobile first paint (lazy load admin, heavy charts, etc.).

### 4.2 CSS

- **Mobile-first** — Base styles for mobile; then `@media (min-width: 769px)` and `@media (min-width: 1025px)` for tablet/desktop. Already largely in place.
- **Viewport-specific** — Use `[data-viewport="mobile"]` (and tablet/desktop) so we load one CSS bundle but only apply rules when that viewport is active; avoids duplicate media queries where the same component needs different layout per viewport.

### 4.3 Performance targets (aspirational)

- **LCP** — Main content visible within 2.5s on 4G.
- **CLS** — No layout shift from viewport detection: useViewport initial state matches first paint (e.g. desktop) or use a small skeleton until viewport is known.
- **Bundle** — Keep main chunk under ~200kb gzipped; heavy features in separate chunks.

---

## 5. Implementation order

1. **Add** `frontend/src/constants/viewport.ts` with breakpoints and type; **update** `useViewport.ts` to use it.
2. **Document** in PROTOCOL-VIEWPORT-SPLIT.md that breakpoints must match `constants/viewport.ts` and link to this plan.
3. **Refine** AppLayout.css: ensure every viewport-specific block is clearly commented (desktop / tablet / mobile).
4. **Add** viewport-specific tests for HomeRoute and, if needed, AppLayout (mobile shows bottom nav, desktop does not).
5. **Optional:** In Vite `manualChunks`, add entries for very large viewport-specific pages if they exist (e.g. admin, digital-twin).

---

## 6. Summary

- **Three code paths:** Desktop (≥1025px), Tablet (769–1024px), Mobile (≤768px). One app, one codebase; behavior and styles branch explicitly by viewport.
- **Production clarity:** One breakpoint source (constants), clear layout/nav rules, checklist for changes, and consistent naming/comments.
- **Optimization:** Lazy routes, sensible chunks, mobile-first CSS, and `data-viewport` for viewport-specific styles without duplication.

This plan aligns with **PROTOCOL-VIEWPORT-SPLIT.md** and makes the three viewport paths explicit and maintainable for production.
