# Scripts

## Google OAuth (one-time setup)

**Primary: Set variables in Railway Dashboard**

1. Get **Client ID** and **Client Secret** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth 2.0 Web client.
2. **Railway Dashboard** → Backend service → Variables: add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`.
3. **Railway Dashboard** → Frontend service → Variables: add `VITE_GOOGLE_CLIENT_ID` (same as Client ID). Redeploy frontend.

See **[docs/05-deployment/Google-SSO-Setup.md](../docs/05-deployment/Google-SSO-Setup.md)** for full steps.

**Legacy (Fly.io):** `set-google-secrets-and-fly.ps1` / `.cmd` – for GitHub→Fly.io. Fly.io is deprecated; use Railway.
