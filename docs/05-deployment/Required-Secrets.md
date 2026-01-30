# Required Secrets & Environment Variables

**Last Updated:** January 26, 2026

---

## GitHub Repository Secrets

These secrets must be configured in GitHub → Settings → Secrets and variables → Actions.

### Deployment Secrets

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `FLY_API_TOKEN` | Fly.io deployment token | Run `flyctl tokens create deploy` in terminal |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier | Cloudflare Dashboard → Overview → Account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token for Pages | Cloudflare Dashboard → Profile → API Tokens → Create Token |

### Setting Up GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

---

## Fly.io Secrets (Backend)

These secrets are stored in Fly.io and injected as environment variables.

### Production (pellicura-api)

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `SECRET_KEY` | JWT signing key (32+ chars) | Yes |
| `ALGORITHM` | JWT algorithm (HS256) | Yes |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry in minutes | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `RUN_MIGRATIONS` | Enable migrations on deploy | Yes |
| `ALLOW_PROD_MIGRATIONS` | Allow production migrations | Yes |
| `APP_NAME` | Application name | No |
| `SENDGRID_API_KEY` | SendGrid email API key | Optional |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `CLOUDINARY_URL` | Cloudinary connection string | Optional |

### Staging (pellicura-api-staging)

Same secrets as production, with staging-specific values.

### Managing Fly.io Secrets

```bash
# Set a secret
flyctl secrets set SECRET_KEY="your-secure-key-here" --app pellicura-api

# Set multiple secrets
flyctl secrets set \
  SECRET_KEY="key" \
  DATABASE_URL="postgresql://..." \
  --app pellicura-api

# List all secrets (names only, values hidden)
flyctl secrets list --app pellicura-api

# Remove a secret
flyctl secrets unset SECRET_KEY --app pellicura-api
```

---

## Environment Variables in fly.toml

These are non-sensitive configuration values set in `fly.toml`.

### Production (backend/fly.toml)

```toml
[env]
  PORT = "8000"
  ENV = "production"
  DEBUG = "false"
  ALLOWED_ORIGINS = "[\"https://pellicura.com\",\"https://www.pellicura.com\"]"
  ALLOWED_HOSTS = "[\"*\"]"
  FRONTEND_URL = "https://pellicura.com"
```

### Staging (backend/fly.staging.toml)

```toml
[env]
  PORT = "8000"
  ENV = "staging"
  DEBUG = "true"
  ALLOWED_ORIGINS = "[\"https://staging.pellicura.pages.dev\"]"
  FRONTEND_URL = "https://staging.pellicura.pages.dev"
```

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
    VITE_API_URL: https://pellicura-api.fly.dev/api/v1
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
| Google OAuth | `GOOGLE_CLIENT_ID` | GitHub Secrets + Fly.io | Google Sign-In button |
| Google OAuth | `GOOGLE_CLIENT_SECRET` | Fly.io only | Backend OAuth exchange |

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set authorized JavaScript origins:
   - `https://staging.pellicura.pages.dev` (staging)
   - `https://pellicura.pages.dev` (production)
4. Set authorized redirect URIs:
   - `https://staging.pellicura.pages.dev/auth/google/callback` (staging)
   - `https://pellicura.pages.dev/auth/google/callback` (production)
5. Copy Client ID and Client Secret
6. Add to GitHub Secrets: `GOOGLE_CLIENT_ID`
7. Add to Fly.io:
   ```bash
   fly secrets set GOOGLE_CLIENT_ID="your-client-id" --app pellicura-api-staging
   fly secrets set GOOGLE_CLIENT_SECRET="your-client-secret" --app pellicura-api-staging
   ```

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
| `FLY_API_TOKEN` | Run `fly tokens create deploy -x 999999h` | ✅ Set |
| `FLY_API_TOKEN_STAGING` | Run `fly tokens create deploy -x 999999h` | ✅ Set |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Overview → Account ID | ✅ Set |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → Profile → API Tokens → Create | ✅ Set |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials → OAuth 2.0 | ⬜ **MISSING** |

**Add secrets at:** https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/settings/secrets/actions

### Fly.io Secrets (Production)
- [x] `SECRET_KEY` - JWT signing key
- [x] `DATABASE_URL` - From Railway
- [x] `RUN_MIGRATIONS=true`
- [x] `ALLOW_PROD_MIGRATIONS=true`
- [x] `ALGORITHM=HS256`
- [x] `ACCESS_TOKEN_EXPIRE_MINUTES=60`
- [x] `OPENAI_API_KEY` - For skin analysis

### Fly.io Secrets (Staging)
- [x] Same as production with staging-specific values
- [ ] `GOOGLE_CLIENT_ID` - **MISSING** - For Google Sign-In
- [ ] `GOOGLE_CLIENT_SECRET` - **MISSING** - For Google OAuth

---

## Security Best Practices

1. **Never commit secrets** to git
2. **Use different secrets** for staging and production
3. **Rotate secrets** quarterly
4. **Use strong random values** for SECRET_KEY
5. **Limit API token permissions** to minimum required

---

**End of Document**
