# Cloudflare Migration Plan

## AI Skincare Intelligence System

**Current Stack (Railway)**
- Frontend: React/Vite (Node.js server)
- Backend: FastAPI (Python)
- Database: PostgreSQL

**Target Stack (Cloudflare)**
- Frontend: Cloudflare Pages
- Backend: Cloudflare Workers (or external Python host)
- Database: Neon PostgreSQL (Cloudflare-compatible)

---

## Executive Summary

| Component | Current | Target | Complexity |
|-----------|---------|--------|------------|
| Frontend | Railway (Node) | Cloudflare Pages | Low |
| Backend | Railway (Python) | See options below | Medium-High |
| Database | Railway PostgreSQL | Neon PostgreSQL | Medium |
| CDN/Assets | Railway | Cloudflare CDN | Low |
| Domain/SSL | Railway | Cloudflare DNS | Low |

---

## Phase 1: Frontend Migration to Cloudflare Pages

### Timeline: 1-2 days

### Steps:

1. **Connect GitHub Repository**
   ```
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project" → "Connect to Git"
   - Select: himprapatel-rgb/ai-skincare-intelligence-system
   - Set root directory: /frontend
   ```

2. **Build Configuration**
   ```yaml
   Build command: npm run build
   Build output directory: dist
   Root directory: frontend
   Node.js version: 20.x
   ```

3. **Environment Variables**
   ```
   VITE_API_URL=https://api.yourdomain.com
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

4. **Custom Domain**
   ```
   - Add custom domain in Pages settings
   - Cloudflare auto-provisions SSL
   - Configure DNS: CNAME → your-project.pages.dev
   ```

### Benefits:
- Global edge network (300+ locations)
- Automatic SSL
- Free tier: unlimited bandwidth
- Instant cache invalidation
- Preview deployments per branch

---

## Phase 2: Database Migration to Neon

### Timeline: 1-2 days

### Why Neon?
- Serverless PostgreSQL (scales to zero)
- Cloudflare Workers compatible
- Same PostgreSQL syntax (minimal code changes)
- Free tier: 512MB storage, 3GB data transfer

### Steps:

1. **Create Neon Project**
   ```
   - Go to neon.tech
   - Create new project
   - Select region closest to users (us-east-1)
   - Copy connection string
   ```

2. **Export Railway Database**
   ```bash
   # From Railway CLI
   railway connect postgres
   
   # Or use pg_dump
   pg_dump -h railway-host -U postgres -d railway > backup.sql
   ```

3. **Import to Neon**
   ```bash
   # Using psql
   psql "postgresql://user:pass@neon-host/dbname" < backup.sql
   
   # Or use Neon's import wizard
   ```

4. **Update Connection Strings**
   ```python
   # backend/app/config.py
   DATABASE_URL = os.getenv("DATABASE_URL")  # Neon connection string
   ```

5. **Verify Data Integrity**
   ```sql
   -- Check row counts
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM scan_sessions;
   SELECT COUNT(*) FROM products;
   ```

---

## Phase 3: Backend Migration

### Option A: Cloudflare Workers (Recommended for new projects)

**Challenge**: Cloudflare Workers uses V8 isolates (JavaScript/TypeScript). Python support is limited.

**Solution**: Rewrite critical endpoints in TypeScript or use Hono framework.

```typescript
// workers/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

app.get('/api/health', (c) => c.json({ status: 'ok' }))

app.get('/api/v1/products', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM products LIMIT 50'
  ).all()
  return c.json(results)
})

export default app
```

**Pros**:
- Global edge deployment
- Scales to millions of requests
- Free tier: 100K requests/day

**Cons**:
- Requires TypeScript rewrite
- Limited Python support
- ML inference needs external service

---

### Option B: Keep Python Backend on Fly.io/Render (Hybrid Approach)

**Architecture**:
```
                    ┌─────────────────┐
                    │  Cloudflare     │
                    │  (DNS + CDN)    │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
   │  Cloudflare   │ │   Fly.io /    │ │     Neon      │
   │    Pages      │ │   Render      │ │  PostgreSQL   │
   │  (Frontend)   │ │  (Backend)    │ │  (Database)   │
   └───────────────┘ └───────────────┘ └───────────────┘
```

**Steps**:

1. **Deploy Backend to Fly.io**
   ```bash
   cd backend
   fly launch --name skincare-api
   fly secrets set DATABASE_URL="postgresql://..."
   fly deploy
   ```

2. **Configure Cloudflare Proxy**
   ```
   # Cloudflare DNS
   api.yourdomain.com → CNAME → skincare-api.fly.dev
   
   # Enable Cloudflare proxy (orange cloud)
   # This adds CDN caching + DDoS protection
   ```

3. **Update Frontend API URL**
   ```
   VITE_API_URL=https://api.yourdomain.com
   ```

**Pros**:
- No code rewrite needed
- Python ML models work as-is
- Cloudflare still provides CDN + security

**Cons**:
- Not fully on Cloudflare
- Additional provider to manage

---

### Option C: Cloudflare Workers + Python via Pyodide (Experimental)

**Note**: Limited support, not recommended for production ML workloads.

```javascript
// Use Python in Workers via WebAssembly
import { loadPyodide } from 'pyodide'

export default {
  async fetch(request) {
    const pyodide = await loadPyodide()
    const result = await pyodide.runPython(`
      # Python code here
      result = 1 + 1
      result
    `)
    return new Response(result)
  }
}
```

---

## Phase 4: Domain & DNS Migration

### Timeline: 1 day

### Steps:

1. **Add Domain to Cloudflare**
   ```
   - Cloudflare Dashboard → Add Site
   - Enter your domain
   - Update nameservers at registrar
   ```

2. **DNS Records**
   ```
   Type    Name    Content                      Proxy
   ─────────────────────────────────────────────────────
   CNAME   @       your-app.pages.dev          ✅
   CNAME   www     your-app.pages.dev          ✅
   CNAME   api     skincare-api.fly.dev        ✅
   ```

3. **SSL Settings**
   ```
   SSL/TLS → Full (strict)
   Edge Certificates → Always Use HTTPS ✅
   Automatic HTTPS Rewrites ✅
   ```

4. **Security Settings**
   ```
   Security → WAF → Managed Rules → Enable
   Security → Bot Fight Mode → On
   Security → Challenge Passage → 30 minutes
   ```

---

## Phase 5: CDN & Caching Configuration

### Cloudflare Cache Rules

```javascript
// Page Rules or Cache Rules
// Cache static assets aggressively
Match: *.js, *.css, *.png, *.jpg, *.woff2
Cache Level: Cache Everything
Edge TTL: 1 month

// API responses - short cache
Match: /api/v1/products/*
Cache Level: Cache Everything
Edge TTL: 1 hour

// Don't cache auth endpoints
Match: /api/v1/auth/*
Cache Level: Bypass
```

### Image Optimization

```
Cloudflare → Speed → Optimization
- Polish: Lossless
- Mirage: On (mobile optimization)
- Rocket Loader: Off (React handles JS)
```

---

## Migration Checklist

### Pre-Migration
- [ ] Backup Railway database
- [ ] Document all environment variables
- [ ] Test locally with Neon connection
- [ ] Set up Cloudflare account

### Frontend Migration
- [ ] Connect GitHub to Cloudflare Pages
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Deploy and test
- [ ] Configure custom domain

### Database Migration
- [ ] Create Neon project
- [ ] Export Railway PostgreSQL
- [ ] Import to Neon
- [ ] Update connection strings
- [ ] Verify data integrity
- [ ] Test all queries

### Backend Migration
- [ ] Choose approach (Workers vs Fly.io)
- [ ] Deploy backend
- [ ] Configure Cloudflare proxy
- [ ] Test all API endpoints
- [ ] Update CORS settings

### DNS & Domain
- [ ] Add domain to Cloudflare
- [ ] Update nameservers
- [ ] Configure DNS records
- [ ] Enable SSL/TLS
- [ ] Test domain resolution

### Post-Migration
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify all features work
- [ ] Update documentation
- [ ] Decommission Railway services

---

## Cost Comparison

| Service | Railway (Current) | Cloudflare (Target) |
|---------|-------------------|---------------------|
| Frontend | $5-20/mo | Free (Pages) |
| Backend | $5-20/mo | Free-$5/mo (Workers) or Fly.io $5/mo |
| Database | $5-15/mo | Free-$19/mo (Neon) |
| CDN | Included | Free (Cloudflare) |
| SSL | Included | Free |
| **Total** | **$15-55/mo** | **$0-24/mo** |

---

## Recommended Approach

**For 1Mission Launch:**

1. **Start with Hybrid Approach (Option B)**
   - Frontend → Cloudflare Pages ✅
   - Backend → Fly.io (keep Python) ✅
   - Database → Neon PostgreSQL ✅
   - DNS/CDN → Cloudflare ✅

2. **Future: Full Cloudflare Migration**
   - Gradually rewrite backend to TypeScript
   - Use Cloudflare Workers for edge performance
   - Keep ML inference on dedicated GPU service

---

## Timeline Summary

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Frontend → Cloudflare Pages | 1-2 days |
| 2 | Database → Neon PostgreSQL | 1-2 days |
| 3 | Backend → Fly.io + CF Proxy | 2-3 days |
| 4 | Domain & DNS | 1 day |
| 5 | Testing & Optimization | 2-3 days |
| **Total** | | **7-11 days** |

---

## Questions to Decide

1. **Domain**: What domain will you use? (e.g., skincare.1mission.com)
2. **Backend**: Hybrid (Fly.io) or full rewrite (Workers)?
3. **Timeline**: When do you want to start migration?
4. **Downtime**: Is zero-downtime migration required?

---

*Document created: 2026-01-28*
*Ready to execute when approved.*
