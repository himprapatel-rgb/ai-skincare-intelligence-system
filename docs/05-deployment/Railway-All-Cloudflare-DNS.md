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

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → your domain **pellicura.com** → **DNS**.
2. Add or update records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | www | frontend-production-0415.up.railway.app | Proxied (orange cloud) or DNS only |
| CNAME | @ | frontend-production-0415.up.railway.app | Proxied or DNS only |

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
