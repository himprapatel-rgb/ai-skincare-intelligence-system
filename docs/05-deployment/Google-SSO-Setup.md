# Google Single Sign-On (SSO) Setup

**Last Updated:** January 26, 2026

The app already has Google OAuth in the code (frontend button, callback page, backend `/auth/google`). You only need to create OAuth credentials and set secrets.

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
7. **Authorized JavaScript origins** (add both):
   - `https://staging.pellicura.pages.dev`
   - `https://pellicura.com`
   - `https://www.pellicura.com`
   - (Optional for local dev: `http://localhost:5173`)
8. **Authorized redirect URIs** (add both):
   - `https://staging.pellicura.pages.dev/auth/google/callback`
   - `https://pellicura.com/auth/google/callback`
   - `https://www.pellicura.com/auth/google/callback`
   - (Optional for local dev: `http://localhost:5173/auth/google/callback`)
9. Click **Create**.
10. Copy the **Client ID** and **Client Secret** (you’ll set these as secrets below).

---

## 2. GitHub Secret (for frontend build)

The frontend needs the Client ID at **build time** so the “Continue with Google” button is shown and works.

1. GitHub → your repo → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**:
   - Name: `GOOGLE_CLIENT_ID`
   - Value: paste the **Client ID** from step 1.
3. Save.

Your workflows already use it:
- **Staging:** `deploy-staging.yml` passes `VITE_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}` when building the frontend.
- **Production:** `deploy-cloudflare.yml` does the same for production builds.

After the next frontend deploy (staging or production), the Google button will appear on the auth page.

---

## 3. Fly.io Backend secrets (staging and production)

The backend exchanges the OAuth code for tokens and creates/logs in the user. It needs both Client ID and Client Secret.

### Staging (pellicura-api-staging)

```bash
fly secrets set GOOGLE_CLIENT_ID="YOUR_CLIENT_ID" --app pellicura-api-staging
fly secrets set GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET" --app pellicura-api-staging
```

Ensure `FRONTEND_URL` matches your staging frontend (so redirect_uri matches Google):

```bash
# If not already set in fly.staging.toml or secrets:
fly secrets set FRONTEND_URL="https://staging.pellicura.pages.dev" --app pellicura-api-staging
```

### Production (pellicura-api)

```bash
fly secrets set GOOGLE_CLIENT_ID="YOUR_CLIENT_ID" --app pellicura-api
fly secrets set GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET" --app pellicura-api
```

Ensure `FRONTEND_URL` matches your production frontend:

```bash
fly secrets set FRONTEND_URL="https://pellicura.com" --app pellicura-api
```

(Use `https://www.pellicura.com` if that’s the canonical URL.)

---

## 4. Verify

1. **Staging:** Open https://staging.pellicura.pages.dev/auth → you should see **Continue with Google**. Click it → Google → redirect back → signed in.
2. **Production:** Same on https://pellicura.com/auth after production deploy.

If the button doesn’t appear, the frontend was built without `GOOGLE_CLIENT_ID` (check GitHub Secret and redeploy). If click fails with “redirect_uri mismatch”, the redirect URI in Google Console must exactly match your frontend origin + `/auth/google/callback`, and backend `FRONTEND_URL` must match that origin.

---

## Summary

| Where            | Secret / setting       | Purpose                          |
|------------------|------------------------|----------------------------------|
| GitHub Secrets   | `GOOGLE_CLIENT_ID`     | Frontend build → Google button   |
| Fly.io Staging   | `GOOGLE_CLIENT_ID`     | Backend OAuth exchange           |
| Fly.io Staging   | `GOOGLE_CLIENT_SECRET` | Backend OAuth exchange           |
| Fly.io Staging   | `FRONTEND_URL`         | Must be staging frontend origin  |
| Fly.io Production| `GOOGLE_CLIENT_ID`     | Backend OAuth exchange           |
| Fly.io Production| `GOOGLE_CLIENT_SECRET` | Backend OAuth exchange           |
| Fly.io Production| `FRONTEND_URL`         | Must be production frontend origin |
| Google Console   | OAuth client           | Authorized origins + redirect URIs |

After these are set, Google SSO works as before.
