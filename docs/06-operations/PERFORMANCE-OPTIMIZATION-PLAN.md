# Performance Optimization Plan

**Issue:** Whole website is slow (initial load and navigation).

**Last updated:** February 2026

---

## Root causes identified

### Frontend
1. **Too many CSS files** (7 imports in `main.tsx`; 11 @imports in `index.css`):
   - mobile-app-polish.css (45 KB), mobile-product-ux.css (16 KB), design-system.css (19 KB), settings-mobile-app.css (10 KB), best-apps-mobile.css (9 KB), etc.
   - Final bundled `index-*.css` is **225 kB** (40 kB gzipped) – render-blocking.
   - Many mobile-* CSS files are loaded on desktop/tablet (unused).

2. **Large vendor bundle** (902 kB / 288 KB gzipped):
   - React, ReactDOM, react-router-dom, axios, and other core dependencies.
   - Acceptable size but could be reduced by tree-shaking unused code.

3. **Heavy optional chunks** (lazy-loaded but still large when visited):
   - tensorflow: 1.8 MB (282 KB gzipped) – only for scan page
   - three: 487 KB (123 KB gzipped) – only for 3D mesh (scan / digital twin)
   - export-pdf: 541 KB (159 KB gzipped) – only for data export
   - recharts: 216 KB (56 KB gzipped) – charts on dashboard/progress

4. **AuthContext `/auth/me` call on mount** (when token exists):
   - 4-second timeout; can block perceived load if backend is slow.
   - Railway backend might be cold-starting or DB query slow.

### Backend
5. **No eager loading / N+1 queries** (potential):
   - Need to review endpoints like `/auth/me`, `/api/v1/shelf`, `/api/v1/scan/history` for N+1.
   - DB pool: 20 + 30 overflow; workers: 16 (default). If all workers hold a connection, that's 16–50 connections.

6. **Railway cold start**:
   - If backend sleeps due to inactivity, first request can take 10+ seconds.

### Network
7. **No aggressive caching headers** on static assets (Vite default is good but can be improved).
8. **Fonts from Google** (`@import url('https://fonts.googleapis.com/...')` in index.css) – extra DNS + HTTPS.

---

## Optimization plan

### Phase 1: Critical (Do today)

1. **Consolidate CSS imports** in `main.tsx`:
   - Remove redundant CSS files; keep only: `index.css` (which imports the rest), `mobile-redesign.css` (conditional on mobile).
   - Defer mobile-specific CSS to load only on mobile viewport.

2. **Self-host Inter font** (remove Google Fonts):
   - Download Inter woff2 and serve from `/public/fonts/`. Update index.css.

3. **Preload critical resources** in `index.html`:
   - Add `<link rel="preload" as="style" href="/assets/index-*.css">` (or use script to detect hash).
   - Add `<link rel="modulepreload" href="/assets/vendor-*.js">` and `/assets/index-*.js`.

4. **Backend: review `/auth/me` query**:
   - Ensure no N+1 or missing indexes. Add logging for timing.

5. **Railway: ensure no sleep** (set to always-on if available, or use keep-awake ping).

### Phase 2: Medium (1–3 days)

6. **Split mobile CSS from desktop CSS**:
   - Create `index-mobile.css` and `index-desktop.css`; load conditionally in App or index.html based on viewport.

7. **Remove unused CSS**:
   - Audit: many mobile-* files might have overlapping or unused rules. Consolidate into mobile-redesign.css.

8. **Optimize vendor bundle**:
   - Tree-shake: ensure unused exports from react-router, lucide-react, etc. are not bundled.
   - Consider splitting recharts out of vendor if only used on a few pages.

9. **Backend: add response caching**:
   - Cache-Control headers on static endpoints (e.g. GET /api/v1/content/blogs).
   - Optional: Redis for shelf/routine/notification data with short TTL.

10. **Measure and iterate**:
   - Use Lighthouse to measure LCP, TBT, CLS.
   - Target: LCP < 2.5s, TBT < 200ms, CLS < 0.1.

### Phase 3: Long-term (1–3 weeks)

11. **CDN for static assets**: Use Cloudflare Pages or Railway edge caching.
12. **Image optimization**: Serve WebP, lazy-load below-the-fold images.
13. **Service worker**: Precache vendor.js and index.css for repeat visits.
14. **Backend: horizontal scaling**: Add more Railway instances if load is high; ensure DB pool can handle it.

---

## Quick reference

| Bottleneck | Fix | Effort |
|------------|-----|--------|
| 225 KB CSS (render-blocking) | Remove redundant imports, split mobile/desktop | S–M |
| Google Fonts | Self-host Inter woff2 | S |
| No preload | Add preload for vendor + index | S |
| AuthContext /auth/me | Check backend performance, ensure indexes | S |
| Cold start | Railway keep-awake or always-on | S |
| Large vendor | Tree-shake, split recharts | M |

Implementation starts next.
