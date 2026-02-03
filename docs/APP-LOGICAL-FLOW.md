# App Logical Flow

Overview of routing, auth, redirects, and main user paths. Use this to reason about navigation and fix flow bugs.

---

## 1. Entry and auth

| Entry | Condition | Where they go next |
|-------|-----------|--------------------|
| **Home** `/` | Anyone | Can browse; CTAs to Scan, Auth, Sample Report. |
| **Sign In** `/auth` | Anyone | Login or Register form. |
| **After login/register (email)** | Success | `GET /profile` → **404** → `/onboarding` (new user); else → `/dashboard`. |
| **After Google OAuth** `/auth/google/callback` | Success | `loginWithToken` then `GET /profile` → **404** → `/onboarding`; else → `/dashboard`. |
| **Password reset** `/password-reset` | Anyone | Request email → user clicks link → `/password-reset/confirm?token=...` → on success → `/auth`. |
| **Email verification** `/verify-email` | From link | On success → `/auth?mode=login`. |

**Protected vs public**

- There are **no route guards**: unauthenticated users can open `/dashboard`, `/profile`, `/history`, etc.
- Those pages show an **in-page empty state** (“Sign in to…”) with a button to `/auth`. No redirect.
- Optional improvement: redirect to `/auth?redirect=/dashboard` and, after login, send user to `redirect` (not implemented).

---

## 2. Onboarding

| Action | Where they go |
|--------|----------------|
| **Skip (step 1)** | `/scan`. Onboarding progress cleared from localStorage. |
| **Complete (step 5 submit)** | `POST /profile/baseline` → `/scan`. |
| **Back (with form data)** | Confirm modal: “Leave?” → Leave goes to previous step; Stay stays. |

Onboarding is shown only when **email/password or Google** auth sends new users (profile 404) to `/onboarding`. Direct visit to `/onboarding` is allowed; no redirect to dashboard if already authenticated.

---

## 3. Scan and analysis

| Step | Flow |
|------|------|
| **Start scan** | User can be **guest or logged in**. No redirect to login. |
| **Upload/capture** | File or camera → validate → upload → poll status. |
| **Success** | `navigate(/analysis/${analysis_id})` after short delay. |
| **Failure** | Error state with “Try again” and “Use file upload” (ErrorCard). |
| **Leave page** | Camera is stopped on unmount. |

**Analysis results** `/analysis/:analysisId`

- View report; “Take New Scan” → `/scan`; “Back to Dashboard” → `/`.
- “View” on previous scans → `/analysis/:id`.
- No requirement to be logged in to view (backend may require auth for loading result).

---

## 4. Main app (bottom nav)

Bottom nav is **always visible** (all viewports). Tabs:

| Tab | Route | Logged out behavior |
|-----|--------|----------------------|
| Home | `/` | Homepage. |
| Scan | `/scan` | Scan page (guest allowed). |
| Dashboard | `/dashboard` | Empty state: “Sign in to view…” → button to `/auth`. |
| Shelf | `/myshelf` | Uses ShelfContext; likely empty or sign-in prompt. |
| Profile | `/profile` | Profile/settings; if not logged in, may show sign-in or redirect (check). |

No redirect from nav when not authenticated; each page handles “no user” itself.

---

## 5. Dashboard

| State | What user sees |
|-------|-----------------|
| **Not logged in** | Empty state: “Your Dashboard”, “Sign in to view…”, button → `/auth`. |
| **Logged in, loading** | Skeleton. |
| **Logged in, data** | Welcome, stats (skin score, scans, shelf, routines), Quick Actions (New Scan, Shelf, Routines, Discover), Recent Activity, Next Steps. |
| **First-time (no scans)** | “No activity yet” + “Start your first scan” → `/scan`. |

Quick Actions and Next Steps use `navigate(...)` to `/scan`, `/myshelf`, `/routine-builder`, `/recommendations`, `/history`, `/onboarding` (if incomplete).

---

## 6. Profile and account

| Action | Result |
|--------|--------|
| **Sign Out** (header or nav) | `logout()` then `navigate('/')`. |
| **Delete Account** | API call → on success `navigate('/', { replace: true })`. |
| **Links** | Password → `/password-reset`; Export → `/export`; Comparison → `/comparison`; Help → `/contact`; Terms → `/terms`; **Privacy preferences** → `/consent`. |

---

## 7. Other routes (no auth required unless page logic says so)

- **Sample report** `/analysis/demo` → static sample; “Start Free Skin Scan” → `/scan`.
- **Recommendations** `/recommendations`, **Discover** `/discover` → same page.
- **Product** `/product/:id`, **Compare** `/product/compare` → product details / comparison.
- **Routine Builder** `/routine-builder`, **Favorites** `/favorites`, **History** `/history`, **Digital Twin** `/digital-twin`, **Scanner** `/scanner` → each page may show empty or require auth for data; no global redirect.
- **Legal** `/privacy`, `/terms`, **Support** `/contact`, **Consent** `/consent` → public or in-app; no redirect.
- **Admin** `/admin/*` → Nav link only when `user?.is_admin`; pages may return 403 or empty if not admin (backend-dependent).

---

## 8. 404 and errors

- **Unknown path** → `NotFoundPage` (no redirect).
- **Error boundary** → Fallback with “Try Again” (calls `onRetry` → `navigate('/', { replace: true })`) and “Refresh Page”.

---

## 9. Flow summary (new user)

1. Land on **Home** or go to **Auth** (or Google).
2. **Login/Register** or **Google** → backend returns token; frontend checks **GET /profile**.
3. **404** → **Onboarding**; else → **Dashboard**.
4. **Onboarding**: Skip → **Scan**; Complete → **Scan**.
5. **Scan** → complete → **Analysis results**.
6. From results or nav: **Dashboard**, **Shelf**, **Profile**, etc.

---

## 10. Fix applied (Google callback)

**Before:** After Google sign-in, user always went to `/dashboard`. New Google users never saw onboarding.

**After:** After `loginWithToken`, frontend calls `GET /profile`; if **404**, `navigate('/onboarding', { replace: true })`; else `navigate('/dashboard', { replace: true })`. Matches email/password flow.

---

Use this doc when adding new routes or changing post-login/onboarding/scan redirects so the logical flow stays consistent.
