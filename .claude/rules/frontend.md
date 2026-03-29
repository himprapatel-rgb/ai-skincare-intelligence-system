---
globs:
  - "frontend/src/**/*.{tsx,ts,css}"
---

# Frontend Development Rules — STRICT

## NEVER DO (violations break the app)
- NEVER hardcode hex colors — use `var(--text-primary)`, `var(--bg-secondary)`, etc.
- NEVER hardcode px border-radius — use `var(--radius-sm/md/lg/xl/full)`
- NEVER hardcode rgba() shadows — use `var(--shadow-sm/md/lg/xl/primary/card)`
- NEVER hardcode font-weight numbers — use `var(--font-weight-normal/medium/semibold/bold)`
- NEVER hardcode font-size rem values — use `var(--font-size-xs/sm/base/lg/xl/2xl/3xl)`
- NEVER hardcode line-height — use `var(--line-height-tight/snug/normal/relaxed/loose)`
- NEVER hardcode transition timing — use `var(--transition-fast/base/slow)`
- NEVER hardcode z-index > 10 — use `var(--z-dropdown/sticky/overlay/modal/toast)`
- NEVER use `transition: all` — specify exact properties
- NEVER use `dangerouslySetInnerHTML` without `DOMPurify.sanitize(content)`
- NEVER skip ANY of the 4 responsive breakpoints on a page
- NEVER make touch targets under 44px
- NEVER use `!important` (except global reduced-motion)
- NEVER put sensitive data in localStorage (refresh tokens are httpOnly cookies)
- NEVER use negative margins to break out of AppLayout — use flex: 1 + height: 100%

## ALWAYS DO
- ALWAYS use design tokens from index.css for ALL visual properties
- ALWAYS add all 4 responsive breakpoints: mobile (≤768), tablet (769-1024), laptop (1025-1440), desktop (1441+)
- ALWAYS use `DOMPurify.sanitize()` on any HTML rendering
- ALWAYS use `React.memo()` on components receiving callback props
- ALWAYS use `<ProtectedRoute>` wrapper for authenticated pages
- ALWAYS test: `npx tsc --noEmit` + `npm run build` before committing
- ALWAYS use 16px font-size on mobile inputs (prevents iOS auto-zoom)
- ALWAYS include safe-area padding for iPhone notch
- ALWAYS close dropdowns before navigation/logout

## Component Patterns
- Functional components with hooks only (no class components)
- Lazy-load pages with `React.lazy()` in App.tsx
- Protected routes use `<ProtectedRoute>` wrapper
- Auth state: `AuthContext` (primary), NOT `authStore` (legacy Zustand)
- Logout must: call backend POST /auth/logout, clear ALL localStorage keys including 'auth-storage'

## CSS Design Token Scale (MANDATORY)
```
Font sizes:  var(--font-size-xs/sm/base/lg/xl/2xl/3xl/4xl/5xl)
Font weight: var(--font-weight-normal/medium/semibold/bold/extrabold) → 400/500/600/700/800
Line height: var(--line-height-tight/snug/normal/relaxed/loose) → 1.2/1.35/1.5/1.65/1.75
Spacing:     8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 56px (NO other values)
Gaps:        12px, 20px, 24px (standard) — NO 10px, 14px, 18px, 28px
Radius:      var(--radius-sm/md/lg/xl/2xl/full) → 6/8/12/16/24/9999px
Shadows:     var(--shadow-sm/md/lg/xl/primary/card/card-hover)
Transitions: var(--transition-fast/base/slow) → 0.15s/0.2s/0.3s
Buttons:     var(--button-height-sm/md/lg) → 36/44/52px
Press:       scale(var(--button-press-scale)) → 0.97
Hover lift:  translateY(var(--card-hover-lift)) → -4px
Max width:   var(--content-max-width) → 1120px
```

## Responsive Design — 4 Breakpoints (MANDATORY on EVERY page)
```css
@media (max-width: 768px)                              { /* Mobile: 1col, 16px pad, 48px targets */ }
@media (min-width: 769px) and (max-width: 1024px)     { /* Tablet: 2col, 20px pad */ }
@media (min-width: 1025px) and (max-width: 1440px)    { /* Laptop: 2-3col, 24px pad, 1120px max */ }
@media (min-width: 1441px)                             { /* Desktop: 3col, 1120px centered */ }
```

## Mobile-First Rules
- Mobile components in `src/components/mobile/`
- Touch targets: 44x44px minimum (iOS) / 48x48px (Material)
- Safe areas: `env(safe-area-inset-*)` for iPhone notch
- Bottom nav clearance: `padding-bottom: max(96px, calc(96px + env(safe-area-inset-bottom)))`
- Haptic: `hapticLight()` for taps, `hapticCapture()` for scan
- Chat page: use `body[data-page="chat"]` for full-height layout (NO negative margins)

## Blog System
- Blog links use SLUG: `/blog/{slug}`
- BlogPostPage fetches via: `/content/blogs/by-slug/{slug}` (not numeric ID)
- Fallback to numeric ID if slug fails
- View tracking uses numeric ID from API response
- All blog HTML sanitized with DOMPurify
- Cover images from Unsplash URLs stored in `cover_image_url`

## Auth System
- Primary: `AuthContext` (React Context) — source of truth
- Legacy: `authStore` (Zustand) — clear on logout but don't rely on it
- Logout clears: AUTH_TOKEN, ACCESS_TOKEN, USER, refresh_token, auth-storage
- Login stores token in localStorage + axios default header
- Protected routes redirect to /auth with return URL saved
