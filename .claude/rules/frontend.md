---
globs:
  - "frontend/src/**/*.{tsx,ts,css}"
---

# Frontend Development Rules

## Component Patterns
- Functional components with hooks only (no class components)
- Lazy-load pages with `React.lazy()` in App.tsx
- Use `React.memo()` on components that receive callback props (Camera, LazyImage)
- Protected routes use `<ProtectedRoute>` wrapper

## CSS Design System (STRICT)
- Border radius: `var(--radius-sm/md/lg/xl/full)` — never hardcode px
- Shadows: `var(--shadow-sm/md/lg/xl/primary/card)` — never hardcode rgba()
- Colors: `var(--text-primary/secondary/muted)`, `var(--bg-primary/secondary/tertiary)` — never hardcode hex
- Z-index: `var(--z-dropdown/sticky/overlay/modal/toast)` — never hardcode numbers > 10
- Max content width: 1120px
- Card padding: 24px
- Section padding: 56px vertical
- Standard gaps: 12px, 20px, 24px

## Security
- All `dangerouslySetInnerHTML` MUST use `DOMPurify.sanitize(content)`
- Import: `import DOMPurify from 'dompurify'`
- Never store sensitive data in localStorage (refresh tokens are in httpOnly cookies)

## State Management
- Auth: `AuthContext` (React Context)
- Theme: `ThemeContext`
- API state: fetch in useEffect or custom hooks
- Local UI state: `useState` / `useReducer`
- Global stores: Zustand in `src/stores/`

## API Calls
- Use `api.ts` client for all REST calls
- All endpoints prefixed with `/api/v1/`
- Handle errors via Toast context

## Responsive Design — 4 Breakpoints (MANDATORY on every page)
- **Mobile**: `@media (max-width: 768px)` — 1 column, 16px side padding, 48px touch targets
- **Tablet**: `@media (min-width: 769px) and (max-width: 1024px)` — 2 columns, 20px padding
- **Laptop**: `@media (min-width: 1025px) and (max-width: 1440px)` — 2-3 columns, 24px padding
- **Desktop**: `@media (min-width: 1441px)` — max-width 1120px centered, 24px padding
- Grids: desktop=3col, laptop=3col, tablet=2col, mobile=1col
- Hooks: `useIsMobile()` (≤768), `useIsMobileOrTablet()` (≤1024), `useViewport()` → 'mobile'|'tablet'|'desktop'
- CSS vars: `--breakpoint-mobile: 768px`, `--breakpoint-tablet: 1024px`, `--breakpoint-laptop: 1440px`

## Mobile-First Rules
- Mobile components in `src/components/mobile/` (MobileButton, MobileCard, MobileInput, etc.)
- All inputs MUST be 16px font-size (prevents iOS auto-zoom)
- Touch targets minimum 44x44px (iOS) or 48x48px (Material)
- Use `env(safe-area-inset-*)` for iPhone notch
- Bottom nav clearance: `padding-bottom: max(96px, calc(96px + env(safe-area-inset-bottom)))`
- Haptic feedback: `hapticLight()` for taps, `hapticCapture()` for scan
- Test with: iPhone SE (375px), iPhone 14 (390px), iPad (768px), iPad Pro (1024px)
- Utility classes: `.r-show-mobile`, `.r-hide-mobile`, `.r-grid--2/3/4` (auto-responsive)

## Testing
- TypeScript must compile: `npx tsc --noEmit`
- Build must succeed: `npm run build`
- Unit tests: `npm test`
