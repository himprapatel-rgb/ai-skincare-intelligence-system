# Login & Google Sign-In Troubleshooting

Use this when **login** or **Google login** or **Digital Twin** doesn’t work.

---

## 1. Email / password login “not working”

**Check:**

- **Wrong credentials** – You’ll see “Email or password is incorrect.” Use the correct email/password or reset password.
- **Email not verified** – You’ll see a message about verifying your email. Use the verification link from the sign-up email, or use “Request verification email” on the auth page.
- **Backend unreachable** – You’ll see “Cannot reach the server…” or “Check your internet connection”.  
  - Confirm the **API is running** (e.g. Railway service is up).  
  - Confirm **frontend** is using the right API URL: `VITE_API_URL` in the frontend env (or default in `frontend/src/config.ts`).  
  - Confirm **CORS**: backend `ALLOWED_ORIGINS` (or `FRONTEND_URL`) must include the exact origin the browser uses (e.g. `https://yoursite.com`).

**Backend:** Login is `POST /api/v1/auth/login` with JSON `{ "email": "...", "password": "..." }`. Returns `{ "token": "...", "user": { ... } }`.

---

## 2. Google login “not working”

**Frontend (required for “Continue with Google”):**

- **`VITE_GOOGLE_CLIENT_ID`** must be set **at build time** (e.g. in GitHub Actions env or in the build env).  
  If it’s missing, clicking “Continue with Google” can show an alert that Google sign-in is not configured.
- In **Google Cloud Console** → **APIs & Services** → **Credentials** → your **OAuth 2.0 Client** → **Authorized redirect URIs**, add:
  - **Production:** `https://your-production-domain.com/auth/google/callback`
  - **Staging (e.g. Railway):** `https://your-app.up.railway.app/auth/google/callback`
  - **Local:** `http://localhost:5173/auth/google/callback`

**Backend (required to complete sign-in after Google redirect):**

- **`GOOGLE_CLIENT_ID`** and **`GOOGLE_CLIENT_SECRET`** must be set in the backend environment (e.g. Railway).
- **`FRONTEND_URL`** (or equivalent) must match the frontend origin (used for redirect_uri validation and CORS).

If Google OAuth is not configured on the server, the callback page will show:  
“Google sign-in is not set up on the server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET…”

**Flow:** User clicks “Continue with Google” → redirect to Google → user signs in → redirect to `/auth/google/callback?code=...` → frontend sends `code` and `redirect_uri` to `POST /api/v1/auth/google` → backend exchanges code for tokens and returns JWT → frontend stores token and redirects to dashboard/onboarding.

---

## 3. Digital Twin page “not opening”

**Behavior:**

- **Not logged in (or session expired):** The page opens and shows a card: “Sign in to load your timeline” with a “Log in to access” button. This is expected; open the auth page and sign in.
- **Loading forever:** The request to load the timeline may be slow or the backend may be down. The frontend now uses a **15s timeout**; after that you’ll see an error and can use “Try again”.
- **Backend required:** Digital Twin data comes from `GET /api/v1/digital-twin/query?limit=200`, which **requires authentication**. If the token is missing or invalid, the backend returns 401 and the frontend shows the “Sign in to load your timeline” card.

**Checks:**

- Be sure you’re **logged in** (you have a valid `auth_token` in localStorage, or you signed in this session).
- If the page stays on “Loading…” for a long time, check that the **API** is up and that **CORS** allows your frontend origin.
- If you see “Sign in to load your timeline” but you believe you’re signed in, try **logging out and back in**, then open Digital Twin again.

---

## 4. Quick checklist

| Issue              | What to check |
|--------------------|----------------|
| Login fails        | Backend up, CORS, correct email/password, email verified. |
| Google button does nothing | `VITE_GOOGLE_CLIENT_ID` set at build time. |
| Google redirect then error | Backend `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`; redirect URI in Google Console; `FRONTEND_URL` / CORS. |
| Digital Twin blank / loading | Logged in? Backend up? After 15s you should see error + “Try again”. |
| Digital Twin “Sign in to load” | Expected when not logged in or 401; use “Log in to access” or re-login. |

---

## 5. Where it’s configured

- **Frontend API base:** `frontend/src/config.ts` (`VITE_API_URL`).
- **Frontend Google Client ID:** `VITE_GOOGLE_CLIENT_ID` (build env); used in `frontend/src/components/GoogleSignInButton.tsx`.
- **Backend auth:** `backend/app/api/v1/endpoints/auth.py` (login, Google callback).
- **Backend CORS / frontend URL:** `backend/app/config.py` (`ALLOWED_ORIGINS`, `FRONTEND_URL`).
- **Digital Twin API:** `backend/app/routers/digital_twin.py` (`/digital-twin/query`); requires auth.
