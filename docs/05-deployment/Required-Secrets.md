# Required Secrets & Environment Variables

**Last Updated:** January 26, 2026

---

## GitHub Repository Secrets

These secrets must be configured in GitHub → Settings → Secrets and variables → Actions.

### Deployment Secrets

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier | Cloudflare Dashboard → Overview → Account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (Pages + DNS if using set-cloudflare-dns-railway workflow) | Cloudflare Dashboard → Profile → API Tokens. For DNS workflow: needs Zone:Read, Zone:DNS:Edit |

### Setting Up GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

---

## Railway Backend Variables

Set in Railway Dashboard → backend service → Variables.

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | JWT signing key (32+ chars) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `FRONTEND_URL` | Frontend origin (e.g. https://pellicura.com) | Yes |
| `ALLOWED_ORIGINS` | JSON array of CORS origins | Yes |
| `OPENAI_API_KEY` | OpenAI API for skin analysis | Optional |
| `GOOGLE_CLIENT_ID` | Google OAuth | For Google Sign-In |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | For Google Sign-In |

---

## Frontend Environment Variables

Frontend uses Vite, which requires environment variables at **build time**.

### Build-Time Variables

| Variable | Description | Set In |
|----------|-------------|--------|
| `VITE_API_URL` | Backend API URL | GitHub Actions workflow |

### GitHub Actions Configuration

In `.github/workflows/deploy-cloudflare.yml`:
```yaml
- name: Build frontend
  run: npm run build
  env:
    VITE_API_URL: https://ai-skincare-intelligence-system-production.up.railway.app/api/v1
```

---

## Database Configuration

### Two-Database Architecture

The system uses **two separate databases** for better scalability:

| Database | Variable | Purpose |
|----------|----------|---------|
| Main Database | `DATABASE_URL` | Users, scans, shelf, routines, authentication |
| Product Catalog | `PRODUCT_DATABASE_URL` | Products, ingredients, brands (separate!) |

**Benefits of Separate Product Database:**
- Product data scales independently
- Product lookups don't compete with user operations
- Product catalog can be cached more aggressively
- Catalog could be shared across multiple apps

### Railway PostgreSQL (Main Database)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full connection string from Railway |

Format: `postgresql://user:password@host:port/database`

### Product Catalog Database (NEW)

| Variable | Description |
|----------|-------------|
| `PRODUCT_DATABASE_URL` | Connection string for product catalog database |

**Options for Product Database:**
1. **Same as main DB** (simplest): Set `PRODUCT_DATABASE_URL` same as `DATABASE_URL`
2. **Railway (second DB)**: Create another PostgreSQL instance on Railway
3. **Supabase**: Good free tier, excellent tooling
4. **Neon**: Serverless PostgreSQL, good for low traffic

### Getting Railway Connection String

1. Go to Railway Dashboard
2. Select your PostgreSQL service
3. Click **Variables** tab
4. Copy `DATABASE_URL`

### Setting Up Product Database

```bash
# Option 1: Use same database (tables are separate)
fly secrets set PRODUCT_DATABASE_URL="$DATABASE_URL" --app pellicura-api

# Option 2: Create separate database on Railway and use that URL
fly secrets set PRODUCT_DATABASE_URL="postgresql://..." --app pellicura-api
```

---

## Third-Party API Keys

### Required for Core Features

| Service | Secret Name | Purpose | Required |
|---------|-------------|---------|----------|
| OpenAI | `OPENAI_API_KEY` | AI skin analysis (GPT-4 Vision) | **YES** - Core feature |

### Google OAuth (Social Login)

| Service | Secret Name | Where to Set | Purpose |
|---------|-------------|--------------|---------|
| Google OAuth | `GOOGLE_CLIENT_ID` | GitHub Secrets + Railway | Google Sign-In (frontend build + backend) |
| Google OAuth | `GOOGLE_CLIENT_SECRET` | GitHub Secrets + Railway | Backend OAuth exchange |

**Full step-by-step:** See **[Google-SSO-Setup.md](./Google-SSO-Setup.md)**.

**Quick steps:**
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth 2.0 Client ID (Web application).
2. Authorized JavaScript origins: `https://staging.pellicura.pages.dev`, `https://pellicura.com`, `https://www.pellicura.com`.
3. Authorized redirect URIs: `https://staging.pellicura.pages.dev/auth/google/callback`, `https://pellicura.com/auth/google/callback`, `https://www.pellicura.com/auth/google/callback`.
4. GitHub Secrets → `GOOGLE_CLIENT_ID` (Client ID).
5. Fly.io staging: `fly secrets set GOOGLE_CLIENT_ID="..." GOOGLE_CLIENT_SECRET="..." --app pellicura-api-staging`
6. Fly.io production: `fly secrets set GOOGLE_CLIENT_ID="..." GOOGLE_CLIENT_SECRET="..." --app pellicura-api`

### Optional Integrations

| Service | Secret Name | Purpose | Required |
|---------|-------------|---------|----------|
| SendGrid | `SENDGRID_API_KEY` | Email sending | For email features |
| Cloudinary | `CLOUDINARY_URL` | Image storage | For image uploads |
| Skinive | `SKINIVE_API_KEY` | Additional skin analysis | Optional |

---

## Quick Setup Checklist

### GitHub Secrets (REQUIRED for CI/CD)

⚠️ **CI/CD will fail without these!**

| Secret | How to Get | Status |
|--------|------------|--------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Overview → Account ID | ✅ Set |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → Profile → API Tokens → Create | ✅ Set |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials → OAuth 2.0. See [Google-SSO-Setup.md](./Google-SSO-Setup.md) | ⬜ Set for Google SSO |
| `GOOGLE_CLIENT_SECRET` | Same OAuth 2.0 client → Client Secret. Used by **Set Fly.io Google Secrets (Staging)** workflow to push to Fly.io | ⬜ Set for Google SSO |

**Add secrets at:** https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/settings/secrets/actions

**Google OAuth:** Run `.\scripts\set-google-secrets-and-fly.ps1` to add `GOOGLE_CLIENT_SECRET` to GitHub. Set both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Railway backend Variables.

### Railway Backend Variables
- [x] `SECRET_KEY`, `DATABASE_URL`, `FRONTEND_URL`, `ALLOWED_ORIGINS`
- [x] `OPENAI_API_KEY` - For skin analysis
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - For Google Sign-In

---

## Security Best Practices

1. **Never commit secrets** to git
2. **Use different secrets** for staging and production
3. **Rotate secrets** quarterly
4. **Use strong random values** for SECRET_KEY
5. **Limit API token permissions** to minimum required

---

**End of Document**
