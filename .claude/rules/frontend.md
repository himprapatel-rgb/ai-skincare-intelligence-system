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

## Mobile
- Mobile components in `src/components/mobile/`
- Use `useIsMobile()` hook for responsive logic
- Touch targets minimum 44x44px
- Test with viewport 375px width (iPhone SE)

## Testing
- TypeScript must compile: `npx tsc --noEmit`
- Build must succeed: `npm run build`
- Unit tests: `npm test`
