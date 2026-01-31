# Google Login Troubleshooting (Railway)

**Status:** Google sign-in is working on pellicura.com. If you have issues, follow these checks:

---

## 1. Backend variables (Railway backend service)

In **Railway Dashboard** → your project → **Backend service** → **Variables**:

| Variable | Required | Value |
|----------|----------|-------|
| `GOOGLE_CLIENT_ID` | ✅ Yes | From [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth 2.0 client |
| `GOOGLE_CLIENT_SECRET` | ✅ Yes | Same OAuth client → Client secret |
| `FRONTEND_URL` | ✅ Yes | `https://pellicura.com` (or `https://frontend-production-0415.up.railway.app` if that's your primary URL) |

If `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is missing, the backend returns **501 "Google OAuth is not configured"**.

---

## 2. Frontend build variable (Railway frontend service)

The frontend needs the Client ID at **build time**. In **Railway Dashboard** → **Frontend service** → **Variables**:

| Variable | Required | Value |
|----------|----------|-------|
| `VITE_GOOGLE_CLIENT_ID` | ✅ Yes | Same value as `GOOGLE_CLIENT_ID` |

If this is not set, the "Continue with Google" button may show an alert, or the OAuth redirect may fail.

**Important:** After adding or changing `VITE_GOOGLE_CLIENT_ID`, you must **redeploy** the frontend (Railway rebuilds the Docker image).

---

## 3. Google Cloud Console – redirect URIs

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Open your **OAuth 2.0 Web application** client
3. Under **Authorized redirect URIs**, add **exactly** these (no trailing slash):

   ```
   https://pellicura.com/auth/google/callback
   https://www.pellicura.com/auth/google/callback
   https://frontend-production-0415.up.railway.app/auth/google/callback
   http://localhost:5173/auth/google/callback
   ```

4. Under **Authorized JavaScript origins**, add:

   ```
   https://pellicura.com
   https://www.pellicura.com
   https://frontend-production-0415.up.railway.app
   http://localhost:5173
   ```

5. Click **Save**

---

## 4. Error messages and what they mean

| What you see | Likely cause | Fix |
|--------------|--------------|-----|
| Alert: "Google sign-in is not configured" | `VITE_GOOGLE_CLIENT_ID` not set at frontend build time | Add variable to Railway frontend, redeploy |
| "Google OAuth is not configured" (501) | Backend missing `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` | Add both to Railway backend Variables |
| "redirect_uri_mismatch" | Callback URL not in Google Console | Add the exact URL from the error page to Authorized redirect URIs |
| "Backend not reachable" on auth page | API down or CORS | Check backend health, ensure frontend origin is in `ALLOWED_ORIGINS` |
| "No authorization code received" | User cancelled, or redirect failed | Try again; ensure redirect URI is correct |

---

## 5. Quick checklist

- [ ] `GOOGLE_CLIENT_ID` set in Railway **backend**
- [ ] `GOOGLE_CLIENT_SECRET` set in Railway **backend**
- [ ] `FRONTEND_URL` set in Railway **backend** (e.g. `https://pellicura.com`)
- [ ] `VITE_GOOGLE_CLIENT_ID` set in Railway **frontend** (same as Client ID)
- [ ] Frontend **redeployed** after setting `VITE_GOOGLE_CLIENT_ID`
- [ ] Redirect URIs added in Google Cloud Console
- [ ] JavaScript origins added in Google Cloud Console
