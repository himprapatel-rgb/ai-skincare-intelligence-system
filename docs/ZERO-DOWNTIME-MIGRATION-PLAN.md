# Zero-Downtime Migration Plan

## AI Skincare Intelligence System → Cloudflare

**Start Date**: 2026-01-29  
**Strategy**: Blue-Green Deployment (Railway runs parallel until verified)

---

## Zero-Downtime Strategy

```
                    PHASE 1-3: Build New Environment
                    ─────────────────────────────────
                    
    RAILWAY (BLUE - LIVE)              CLOUDFLARE (GREEN - STAGING)
    ┌─────────────────────┐            ┌─────────────────────────┐
    │  Frontend (Live)    │            │  Cloudflare Pages       │
    │  Backend (Live)     │            │  Fly.io Backend         │
    │  PostgreSQL (Live)  │            │  Neon PostgreSQL        │
    └─────────────────────┘            └─────────────────────────┘
              │                                    │
              │         ← Test & Verify →          │
              │                                    │
              ▼                                    ▼
              
                    PHASE 4: DNS Switch (Zero Downtime)
                    ────────────────────────────────────
                    
    RAILWAY (BLUE - STANDBY)           CLOUDFLARE (GREEN - LIVE)
    ┌─────────────────────┐            ┌─────────────────────────┐
    │  Keep running       │  ← DNS →   │  Frontend (Live)        │
    │  for 48 hours       │  Switch    │  Backend (Live)         │
    │  as fallback        │            │  PostgreSQL (Live)      │
    └─────────────────────┘            └─────────────────────────┘
              │
              ▼
              
                    PHASE 5: Decommission Railway
                    ──────────────────────────────
    
    ┌─────────────────────┐
    │  Shutdown Railway   │
    │  after 48-72 hours  │
    │  of stable running  │
    └─────────────────────┘
```

---

## Execution Plan: Day 1 (2026-01-29)

### Morning Session (2-3 hours)

#### Step 1: Database Replication Setup (30 min)

```bash
# 1. Create Neon account and project
# Go to: https://neon.tech
# Create project: ai-skincare-prod
# Region: us-east-1 (closest to current users)

# 2. Get Neon connection string
# Format: postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb

# 3. Export Railway database
railway connect postgres

# In psql:
\copy users TO '/tmp/users.csv' CSV HEADER;
\copy scan_sessions TO '/tmp/scan_sessions.csv' CSV HEADER;
\copy products TO '/tmp/products.csv' CSV HEADER;
# ... repeat for all tables

# 4. Or use pg_dump for full backup
pg_dump $RAILWAY_DATABASE_URL > railway_backup.sql
```

#### Step 2: Import to Neon (30 min)

```bash
# Connect to Neon
psql $NEON_DATABASE_URL

# Run migrations first
python backend/scripts/run_migrations.py

# Import data
psql $NEON_DATABASE_URL < railway_backup.sql

# Verify counts match
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'scan_sessions', COUNT(*) FROM scan_sessions
UNION ALL
SELECT 'products', COUNT(*) FROM products;
```

#### Step 3: Deploy Backend to Fly.io (45 min)

```bash
# 1. Install Fly CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# 2. Login
fly auth login

# 3. Create fly.toml in backend/
```

```toml
# backend/fly.toml
app = "skincare-api-prod"
primary_region = "iad"  # US East

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  ENVIRONMENT = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[services]]
  protocol = "tcp"
  internal_port = 8080

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = 10000
    grace_period = "10s"
    method = "get"
    path = "/api/health"
    protocol = "http"
    timeout = 2000
```

```bash
# 4. Deploy
cd backend
fly launch --name skincare-api-prod --region iad --no-deploy

# 5. Set secrets
fly secrets set DATABASE_URL="postgresql://user:pass@neon-host/db"
fly secrets set SECRET_KEY="your-secret-key"
fly secrets set GOOGLE_CLIENT_ID="your-google-client-id"
fly secrets set GOOGLE_CLIENT_SECRET="your-google-client-secret"
fly secrets set CLOUDINARY_URL="your-cloudinary-url"

# 6. Deploy
fly deploy

# 7. Verify
fly status
fly logs
curl https://skincare-api-prod.fly.dev/api/health
```

---

### Afternoon Session (2-3 hours)

#### Step 4: Deploy Frontend to Cloudflare Pages (30 min)

```bash
# 1. Go to Cloudflare Dashboard → Pages
# 2. Create project → Connect to Git
# 3. Select repository: ai-skincare-intelligence-system

# Build settings:
#   Framework preset: Vite
#   Build command: npm run build
#   Build output: dist
#   Root directory: frontend

# Environment variables:
#   VITE_API_URL = https://skincare-api-prod.fly.dev
#   VITE_GOOGLE_CLIENT_ID = your-google-client-id

# 4. Deploy
# Cloudflare auto-deploys on push

# 5. Get preview URL
# Example: ai-skincare-xyz.pages.dev
```

#### Step 5: Full Testing on Staging (1-2 hours)

```markdown
## Test Checklist

### Authentication
- [ ] Register new user
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Password reset flow
- [ ] Logout

### Skin Analysis
- [ ] Upload photo
- [ ] Receive analysis results
- [ ] View scan history
- [ ] Delete scan

### Digital Twin
- [ ] View snapshots
- [ ] Before/After comparison
- [ ] Progress chart loads
- [ ] Simulation works

### Products
- [ ] View recommendations
- [ ] Add to shelf
- [ ] Add to favorites
- [ ] Product compare

### Profile
- [ ] View profile
- [ ] Update settings
- [ ] Export data
- [ ] Delete account flow

### Performance
- [ ] Homepage loads < 2s
- [ ] API responses < 500ms
- [ ] Images load properly
- [ ] No console errors
```

---

## Execution Plan: Day 2 (2026-01-30)

### Morning: DNS Migration (Zero Downtime)

#### Step 6: Add Domain to Cloudflare (30 min)

```bash
# Domain already on Cloudflare: pellicura.com
# 1. Go to Cloudflare Dashboard → Select pellicura.com
# 3. Select Free plan
# 4. Cloudflare scans existing DNS

# 5. Update nameservers at your registrar:
#    ns1.cloudflare.com
#    ns2.cloudflare.com

# 6. Wait for propagation (usually 5-30 minutes)
```

#### Step 7: Configure DNS Records

```bash
# Cloudflare DNS Settings

# Frontend (Cloudflare Pages)
Type: CNAME
Name: @ (or www)
Target: ai-skincare-xyz.pages.dev
Proxy: ON (orange cloud)

# API (Fly.io)
Type: CNAME  
Name: api
Target: skincare-api-prod.fly.dev
Proxy: ON (orange cloud)

# If using subdomain for app:
Type: CNAME
Name: app
Target: ai-skincare-xyz.pages.dev
Proxy: ON (orange cloud)
```

#### Step 8: SSL/Security Configuration

```bash
# Cloudflare SSL/TLS Settings
Mode: Full (strict)

# Edge Certificates
Always Use HTTPS: ON
Automatic HTTPS Rewrites: ON
Minimum TLS Version: TLS 1.2

# Security Settings
Security Level: Medium
Challenge Passage: 30 minutes
Bot Fight Mode: ON
```

#### Step 9: Update Frontend Environment

```bash
# Update Cloudflare Pages environment variable
VITE_API_URL = https://api.yourdomain.com

# Trigger redeploy
# Push empty commit or use Cloudflare dashboard
```

---

### Afternoon: Verify & Monitor

#### Step 10: Verify Production (1 hour)

```markdown
## Production Verification

### DNS Resolution
- [ ] Domain resolves to Cloudflare
- [ ] SSL certificate valid
- [ ] API subdomain works

### Full App Test
- [ ] All features work on production domain
- [ ] No mixed content warnings
- [ ] OAuth redirects work
- [ ] Images load from Cloudinary

### Performance
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Verify CDN caching works
```

#### Step 11: Keep Railway Running (Fallback)

```bash
# DO NOT shut down Railway yet!
# Keep it running for 48-72 hours as fallback

# If anything goes wrong:
# 1. Update DNS to point back to Railway
# 2. DNS propagation: 5-30 minutes
# 3. Users experience minimal disruption
```

---

## Execution Plan: Day 3-4 (2026-01-31 to 2026-02-01)

### Monitor & Stabilize

```bash
# Check Cloudflare Analytics
# - Request volume
# - Cache hit ratio
# - Error rates

# Check Fly.io Metrics
# - Response times
# - Memory usage
# - Error logs

# Check Neon Dashboard
# - Query performance
# - Connection count
# - Storage usage
```

### Decommission Railway (After 48-72 hours stable)

```bash
# Only after confirming everything works:

# 1. Stop Railway services
railway down

# 2. Export final backup (just in case)
pg_dump $RAILWAY_DATABASE_URL > final_railway_backup.sql

# 3. Delete Railway project (optional, or keep for records)
```

---

## Rollback Plan

### If Issues on Cloudflare:

```bash
# 1. Update DNS back to Railway (within Cloudflare)
Type: CNAME
Name: @
Target: frontend-production-0415.up.railway.app

Type: CNAME
Name: api
Target: ai-skincare-intelligence-system-production.up.railway.app

# 2. Propagation: 5-30 minutes
# 3. Railway is still running, users see no downtime
```

### If Database Issues:

```bash
# 1. Railway PostgreSQL is still running
# 2. Update backend env to use Railway DATABASE_URL
# 3. Redeploy backend
fly secrets set DATABASE_URL="$RAILWAY_DATABASE_URL"
fly deploy
```

---

## Checklist Summary

### Day 1 (2026-01-29)
- [ ] Create Neon PostgreSQL project
- [ ] Export Railway database
- [ ] Import to Neon
- [ ] Verify data integrity
- [ ] Create Fly.io app
- [ ] Deploy backend to Fly.io
- [ ] Test backend endpoints
- [ ] Deploy frontend to Cloudflare Pages
- [ ] Test staging environment
- [ ] Full feature verification

### Day 2 (2026-01-30)
- [ ] Add domain to Cloudflare
- [ ] Update nameservers
- [ ] Configure DNS records
- [ ] Configure SSL/Security
- [ ] Update frontend API URL
- [ ] Verify production domain
- [ ] Test OAuth redirects
- [ ] Monitor for errors

### Day 3-4 (Monitoring)
- [ ] Monitor analytics
- [ ] Check error rates
- [ ] Verify performance
- [ ] Keep Railway as fallback
- [ ] Decommission Railway (after 48-72h stable)

---

## Contacts & Resources

### Cloudflare
- Dashboard: https://dash.cloudflare.com
- Pages Docs: https://developers.cloudflare.com/pages
- Status: https://www.cloudflarestatus.com

### Fly.io
- Dashboard: https://fly.io/dashboard
- Docs: https://fly.io/docs
- Status: https://status.flyio.net

### Neon
- Dashboard: https://console.neon.tech
- Docs: https://neon.tech/docs
- Status: https://neonstatus.com

---

## Ready for Tomorrow!

**Start time**: When you're ready  
**Estimated duration**: 4-6 hours active work  
**Zero downtime**: Guaranteed with parallel running  

Let's do this! 🚀
