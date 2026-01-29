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

### Railway PostgreSQL

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full connection string from Railway |

Format: `postgresql://user:password@host:port/database`

### Getting Railway Connection String

1. Go to Railway Dashboard
2. Select your PostgreSQL service
3. Click **Variables** tab
4. Copy `DATABASE_URL`

---

## Third-Party API Keys

### Required for Core Features

| Service | Secret Name | Purpose | Required |
|---------|-------------|---------|----------|
| OpenAI | `OPENAI_API_KEY` | AI skin analysis (GPT-4 Vision) | **YES** - Core feature |

### Optional Integrations

| Service | Secret Name | Purpose | Required |
|---------|-------------|---------|----------|
| SendGrid | `SENDGRID_API_KEY` | Email sending | For email features |
| Cloudinary | `CLOUDINARY_URL` | Image storage | For image uploads |
| Skinive | `SKINIVE_API_KEY` | Additional skin analysis | Optional |

---

## Quick Setup Checklist

### GitHub Secrets
- [ ] `FLY_API_TOKEN` - From `flyctl tokens create deploy`
- [ ] `CLOUDFLARE_ACCOUNT_ID` - From Cloudflare dashboard
- [ ] `CLOUDFLARE_API_TOKEN` - Create with Pages permissions

### Fly.io Secrets (Production)
- [ ] `SECRET_KEY` - Generate with `openssl rand -hex 32`
- [ ] `DATABASE_URL` - From Railway
- [ ] `RUN_MIGRATIONS=true`
- [ ] `ALLOW_PROD_MIGRATIONS=true`
- [ ] `ALGORITHM=HS256`
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES=60`

### Fly.io Secrets (Staging)
- [ ] Same as production with staging-specific values

---

## Security Best Practices

1. **Never commit secrets** to git
2. **Use different secrets** for staging and production
3. **Rotate secrets** quarterly
4. **Use strong random values** for SECRET_KEY
5. **Limit API token permissions** to minimum required

---

**End of Document**
