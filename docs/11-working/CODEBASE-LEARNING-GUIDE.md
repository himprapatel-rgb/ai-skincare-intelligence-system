# Codebase learning guide: Mobile, Web, Tablet + Login & loading

Learn how the product works across **mobile**, **web (desktop)**, and **tablet**, and how **login** and **loading** are implemented so you can improve them.

---

## 1. How the app is built (one codebase, three viewports)

- **Single codebase:** One React app serves all devices. There are no separate “mobile” and “web” apps.
- **Viewport = layout mode:** The app decides **Desktop**, **Tablet**, or **Mobile** from the **window width** and uses that everywhere.

### 1.1 Where viewport is defined

| What | Where |
|------|--------|
| **Breakpoints** | `frontend/src/constants/viewport.ts` |
| **Hook** | `frontend/src/hooks/useViewport.ts` |
| **Usage** | `AppLayout`, `HomeRoute`, `ScanPage`, etc. |

**Breakpoints (must match CSS):**

- **Mobile:** `width ≤ 768px` (`MOBILE_MAX = 768`)
- **Tablet:** `769px ≤ width ≤ 1024px` (`TABLET_MAX = 1024`)
- **Desktop:** `width ≥ 1025px` (`DESKTOP_MIN = 1025`)

**Using viewport in a component:**

```ts
import { useViewport } from '../hooks/useViewport';

const viewport = useViewport(); // 'mobile' | 'tablet' | 'desktop'
if (viewport === 'mobile') {
  // Mobile-only UI (e.g. bottom nav, different layout)
}
```

**Helpers:** `isMobileViewport(viewport)`, `isTabletViewport(viewport)`, `isDesktopViewport(viewport)` in `useViewport.ts`.

**Related hooks:**

- `useIsMobile()` – true only for mobile.
- `useIsMobileOrTablet()` – true for mobile or tablet (e.g. Scan 3D view only on mobile/tablet).

---

## 2. How mobile vs web/tablet differs in the UI

### 2.1 Home route (“/”)

- **File:** `frontend/src/components/HomeRoute.tsx`
- **Desktop & tablet:** Renders **HomePage** (marketing).
- **Mobile:** Renders **TodayPage** (TODAY hub). So the **same URL “/”** shows different pages by viewport.

### 2.2 App shell (mobile-only)

- **File:** `frontend/src/components/AppLayout.tsx`
- **Mobile + app route:** Uses “app shell” mode: minimal footer, **bottom nav** (e.g. Home, Scan, Dashboard), `data-viewport="mobile"`.
- **Desktop / tablet:** Full header nav, no bottom nav.
- **Logic:** `isAppRoute = viewport === 'mobile' && pathIsAppRoute`; `pathIsAppRoute` is true for routes like `/`, `/scan`, `/dashboard`, `/profile`, etc.

### 2.3 Navigation

- **Desktop:** Top nav links (Home, Scan, Dashboard, Digital Twin, About, Admin if admin).
- **Tablet:** Same top nav (same as desktop in current code).
- **Mobile:** Hamburger menu that opens a **drawer** with links + bottom nav for main tabs.

### 2.4 CSS and styles

- **Global:** `index.css`, `styles/premium-polish.css`, `styles/mobile-app-polish.css`, etc. in `main.tsx`.
- **Breakpoints:** Same 768 / 1024 as in `viewport.ts`. Many components use `@media (max-width: 768px)` for mobile.
- **Layout:** `AppLayout` sets `data-viewport={viewport}` on the root div so CSS can use `[data-viewport="mobile"]` etc. if needed.

---

## 3. Login flow (end-to-end)

### 3.1 Frontend

| Step | Where | What happens |
|------|--------|--------------|
| 1 | **AuthPage** | User opens `/auth`. AuthPage mounts and can fire a **GET /api/health** to wake the backend. |
| 2 | **LoginForm** | User enters email/password and clicks “Sign In”. LoginForm calls `login(email, password)` from **AuthContext**. |
| 3 | **AuthContext.login** | `POST ${API_BASE_URL}/auth/login` with `{ email, password }`. On success: stores token in localStorage, sets axios default header, sets `user` and `token` in state. |
| 4 | **AuthPage.handleAuthSuccess** | Called after login success. **Navigates immediately** to `/dashboard` (or returnUrl). Then in background calls `GET /profile`; if 404, redirects to `/onboarding`. |
| 5 | **AuthContext** | `isAuthenticated = !!token && !!user`. Rest of app (e.g. AppLayout) shows “signed in” UI. |

**Files:**

- **Auth:** `frontend/src/context/AuthContext.tsx` – token, user, `login`, `register`, `logout`, `isLoading`.
- **Auth page:** `frontend/src/pages/AuthPage.tsx` – auth vs register mode, `handleAuthSuccess`, health ping on load.
- **Login form:** `frontend/src/components/LoginForm.tsx` – email/password, validation, “Signing in…” state, Google button, error messages.

### 3.2 Backend

| Step | Where | What happens |
|------|--------|--------------|
| 1 | **POST /api/v1/auth/login** | `backend/app/api/v1/endpoints/auth.py` – `login()`. |
| 2 | Rate limit | `check_login_rate_limit(request)` – in-memory per IP. |
| 3 | DB + password | `get_user_by_email(db, email)`; `auth_service.verify_password(hashed, password)` (Argon2). |
| 4 | Test users / verified | Test users forced verified/active; else require `user.is_verified`. |
| 5 | Response | **IP/geo** is logged in a **background task** (not blocking). Token created with `create_access_token`, return `AuthResponse(token, user)`. |

**Files:**

- **Auth endpoints:** `backend/app/api/v1/endpoints/auth.py` – login, register, verify-email, password-reset, Google.
- **Auth service:** `backend/app/services/auth_service.py` – `get_user_by_email`, `verify_password`, `hash_password`.
- **Security:** `backend/app/core/security.py` – JWT creation, password hasher (Argon2).

### 3.3 What can make login feel slow

- **Cold start:** First request after idle (e.g. Railway) can take 30–60s. Mitigations: health ping when auth page loads, keep-awake workflow.
- **Password check:** Argon2 verify is intentionally ~100–200ms.
- **Blocking work in request:** Already moved IP/geo to background; nothing else heavy in the login handler.

---

## 4. Loading (how pages and UI show “loading”)

### 4.1 App-level loading (auth init)

- **AuthContext** has `isLoading`. It starts `true` and becomes `false` after:
  - No stored token → `setIsLoading(false)`.
  - Stored token → race between `GET /auth/me` and a **4s timeout**; then `setIsLoading(false)`.
- **Who uses it:** **AppLayout** reads `useAuth().isLoading`. When `true`, it renders **only** `<LoadingScreen message="Loading" fullscreen />` (no header, no nav). So the user sees a single loading screen until auth is ready or the 4s timeout; then the full layout (signed-in or signed-out) appears. This avoids a flash of “Sign in” before `/auth/me` completes.

### 4.2 Route / page loading (lazy chunks)

- **App.tsx:** Every page is `React.lazy(() => import('./pages/...'))`. So when you navigate to a route, the **page chunk** loads and React shows the Suspense fallback until the chunk is ready.
- **Suspense fallback:** `<LoadingScreen message="Loading page..." fullscreen={false} />` (in `App.tsx`).
- **Prefetch:** In **AppLayout**, many nav links have `onMouseEnter` (desktop) or `onTouchStart` (mobile) that run `void import('../pages/...')` so the chunk starts loading before the user clicks. That makes the next page load feel faster.

### 4.3 Loading components

| Component | Use |
|-----------|-----|
| **LoadingScreen** | Full-screen or inline block with spinner + message. Used as Suspense fallback and on some pages (e.g. ProductDetailsPage “Loading reviews”). |
| **LoadingSpinner** | Small/medium/large spinner + optional message. Used in **LoginForm** (“Signing in…”) and elsewhere. Has `role="status"` and `aria-live="polite"`. |
| **RouteLoadingBar** | Thin top progress bar on route change. Shown in **AppLayout**; appears for ~400ms when `location.pathname` changes. |

**Files:**

- `frontend/src/components/LoadingScreen.tsx` + `LoadingScreen.css`
- `frontend/src/components/LoadingSpinner.tsx`
- `frontend/src/components/RouteLoadingBar.tsx` + `RouteLoadingBar.css`

### 4.4 Page-level loading (data fetching)

Many pages keep local `isLoading` and fetch data in `useEffect`:

- **DashboardPage, FavoritesPage, HistoryPage, DigitalTwinTimelinePage, RoutineBuilderPage, AdminDashboardPage, AdminUsersPage, ProgressTrackingPage**, etc.
- Pattern: `const [isLoading, setIsLoading] = useState(true)`; in `useEffect` call API then `setIsLoading(false)`. While `isLoading` they render a skeleton or “Loading…” or `<LoadingScreen />`.

---

## 5. Where to improve login and loading

### 5.1 Login

- **Backend:** Already fast (geo in background, no extra blocking). Optional: add timing logs to confirm.
- **Frontend:** Health ping on auth page and immediate navigate after login are done. Optional: show a short “Taking you to dashboard…” right after click so the user knows something is happening before navigation.
- **Cold start:** Rely on health ping + keep-awake; consider a small “Waking up server…” message if the first request is slow (e.g. detect long wait and show toast).

### 5.2 Loading

- **Auth init:** **AppLayout** already shows `<LoadingScreen fullscreen />` while `useAuth().isLoading` is true, so the app does not render the full layout (and no “signed out” flash) until auth is ready or the 4s timeout.
- **Route transitions:** Suspense + LoadingScreen + RouteLoadingBar are in place. You can tune the bar duration or the fallback message per route if needed.
- **Prefetch:** Already on main nav links; you can add prefetch for more routes or for the auth page when the user hovers “Sign In”.
- **Accessibility:** LoadingScreen uses `role="status"`, `aria-live="polite"`, and `aria-label={message}` so screen readers announce loading.

---

## 6. Quick file index

| Area | Key files |
|------|-----------|
| **Viewport** | `constants/viewport.ts`, `hooks/useViewport.ts`, `hooks/useIsMobile.ts`, `hooks/useIsMobileOrTablet.ts` |
| **Layout** | `components/AppLayout.tsx`, `components/HomeRoute.tsx` |
| **Auth (FE)** | `context/AuthContext.tsx`, `pages/AuthPage.tsx`, `components/LoginForm.tsx` |
| **Auth (BE)** | `backend/app/api/v1/endpoints/auth.py`, `backend/app/services/auth_service.py`, `backend/app/core/security.py` |
| **Loading** | `components/LoadingScreen.tsx`, `components/LoadingSpinner.tsx`, `components/RouteLoadingBar.tsx` |
| **Routes** | `App.tsx` (lazy imports + Routes + Suspense) |
| **Responsive CSS** | `frontend/docs/RESPONSIVE.md`, `styles/*.css`, `AppLayout.css` |

---

## 7. How to run and test

- **Web (desktop):** Run the app and use a wide window (≥1025px) or desktop Chrome.
- **Tablet:** Resize to 769–1024px or use DevTools device “iPad”.
- **Mobile:** Resize to ≤768px or use DevTools device “iPhone” / “Pixel”. Bottom nav and TodayPage at “/” appear in mobile viewport.
- **Login:** Go to `/auth`, sign in; watch Network for `POST /auth/login` and `GET /auth/me` (or `/profile`). Backend logs and timing will show where time is spent.

Using this guide you can trace any behavior (mobile vs tablet vs desktop, login, or loading) to the right files and improve the code in one place with confidence.
