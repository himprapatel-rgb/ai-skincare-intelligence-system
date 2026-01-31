# Google Single Sign-On (SSO) Setup

**Last Updated:** January 31, 2026

**Status:** ✅ Working – Google sign-in is live on pellicura.com.

The app has Google OAuth in the code (frontend button, callback page, backend `/auth/google`). Set credentials in Railway and Google Console.

---

## 1. Create Google OAuth 2.0 credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Select your project (or create one).
3. Click **+ Create Credentials** → **OAuth client ID**.
4. If prompted, configure the **OAuth consent screen**:
   - User type: **External** (or Internal for workspace-only).
   - App name: e.g. **Pellicura** or **AI Skincare**.
   - Support email: your email.
   - Save.
5. Application type: **Web application**.
6. Name: e.g. **Pellicura Web**.
7. **Authorized JavaScript origins** (add):
   - `https://pellicura.com`
   - `https://www.pellicura.com`
   - `https://frontend-production-0415.up.railway.app`
   - (Optional: `http://localhost:5173`)
8. **Authorized redirect URIs** (add **exactly**; Google is strict):
   - `https://pellicura.com/auth/google/callback`
   - `https://www.pellicura.com/auth/google/callback`
   - `https://frontend-production-0415.up.railway.app/auth/google/callback`
   - (Optional: `http://localhost:5173/auth/google/callback`)
9. Click **Create**.
10. Copy the **Client ID** and **Client Secret**.

---

## 2. Railway Backend variables

Set in **Railway Dashboard** → your project → **Backend service** → **Variables**:

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | Your Client ID from step 1 |
| `GOOGLE_CLIENT_SECRET` | Your Client Secret from step 1 |
| `FRONTEND_URL` | `https://pellicura.com` (or your canonical frontend URL) |

Redeploy the backend after adding these.

---

## 3. Railway Frontend variables

Set in **Railway Dashboard** → **Frontend service** → **Variables**:

| Variable | Value |
|----------|-------|
| `VITE_GOOGLE_CLIENT_ID` | Same Client ID as backend |
| `VITE_API_URL` | `https://ai-skincare-intelligence-system-production.up.railway.app/api/v1` |

Redeploy the frontend after adding `VITE_GOOGLE_CLIENT_ID` (required at build time).

---

## 4. GitHub Secret (optional – for CI builds)

If your frontend is built by GitHub Actions (e.g. deploy-cloudflare), add:

- **GitHub** → Settings → Secrets → `GOOGLE_CLIENT_ID` = your Client ID

---

## 5. Verify

1. Open https://pellicura.com/auth
2. Click **Continue with Google**
3. Sign in with Google → redirect back → signed in

---

## Troubleshooting

See **[GOOGLE-LOGIN-TROUBLESHOOTING.md](../11-working/GOOGLE-LOGIN-TROUBLESHOOTING.md)** for common issues (Network Error, redirect_uri_mismatch, etc.).

---

## Summary

| Where | Variable | Purpose |
|-------|----------|---------|
| Railway Backend | `GOOGLE_CLIENT_ID` | OAuth code exchange |
| Railway Backend | `GOOGLE_CLIENT_SECRET` | OAuth code exchange |
| Railway Backend | `FRONTEND_URL` | Redirect URI base |
| Railway Frontend | `VITE_GOOGLE_CLIENT_ID` | Google button (build-time) |
| Google Console | OAuth client | Authorized origins + redirect URIs |
