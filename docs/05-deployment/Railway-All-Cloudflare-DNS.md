# Railway for Everything + Cloudflare DNS (pellicura.com)

**Last Updated:** January 2026

---

## Architecture

| Component | Hosted On | URL |
|-----------|-----------|-----|
| **Frontend** | Railway | https://frontend-production-0415.up.railway.app |
| **Backend** | Railway | https://ai-skincare-intelligence-system-production.up.railway.app |
| **Database** | Railway | PostgreSQL (main + product catalog) |
| **Domain** | Cloudflare | pellicura.com (DNS only) |

**Domain pellicura.com** is managed in Cloudflare. Point it to the Railway frontend so users visit https://pellicura.com.

---

## 1. Add Custom Domain to Railway Frontend

1. Go to [Railway Dashboard](https://railway.app/dashboard) → your project → **frontend** service.
2. Open **Settings** → **Networking** → **Custom Domain**.
3. Add **pellicura.com** and **www.pellicura.com**.
4. Railway will show the CNAME target (e.g. `frontend-production-0415.up.railway.app` or a `*.railway.app` hostname).

---

## 2. Configure Cloudflare DNS

### Option A: One-click via GitHub Actions

1. **Create a Cloudflare API token** with `Zone:Zone:Read` and `Zone:DNS:Edit` (Dashboard → Profile → API Tokens → Create). Add it to GitHub Secrets as `CLOUDFLARE_API_TOKEN` (or create `CLOUDFLARE_DNS_TOKEN` if your existing token is Pages-only).
2. Go to **GitHub** → **Actions** → **Set Cloudflare DNS for Railway**.
3. Click **Run workflow**. If the zone lookup fails, get your Zone ID from Cloudflare Dashboard → pellicura.com → Overview (right sidebar) and pass it as the `zone_id` input.

### Option B: Manual in Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → your domain **pellicura.com** → **DNS**.
2. Add or update records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | @ | j62m06la.up.railway.app | Proxied (recommended) |
| CNAME | www | fcqgs166.up.railway.app | Proxied (recommended) |

**Note:** For apex (@) domain, Cloudflare supports CNAME flattening. If Railway gives a different target, use that. Some setups use `A` records; follow Railway’s instructions.

3. Remove or disable any existing records pointing to Cloudflare Pages or Fly.io for production.

---

## 3. Verify

- **Frontend:** https://pellicura.com (after DNS propagates)
- **API:** https://ai-skincare-intelligence-system-production.up.railway.app/api/health
- **API docs:** https://ai-skincare-intelligence-system-production.up.railway.app/docs

---

## 4. Environment Variables (Railway)

**Frontend service:**
- `VITE_API_URL` = https://ai-skincare-intelligence-system-production.up.railway.app/api/v1
- `VITE_GOOGLE_CLIENT_ID` = (your Google OAuth client ID)

**Backend service:**
- `FRONTEND_URL` = https://pellicura.com
- `ALLOWED_ORIGINS` = includes pellicura.com, www.pellicura.com, frontend-production-0415.up.railway.app

---

## No Fly.io

Production does not use Fly.io. Frontend, backend, and database run on Railway. The domain is served via Cloudflare DNS only.
