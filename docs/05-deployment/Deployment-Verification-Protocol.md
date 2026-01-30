# Deployment Verification Protocol

**Last Updated:** January 26, 2026  
**Purpose:** Checklist to verify deployments succeeded without errors

---

## After Every Push/Deploy

### 1. Check GitHub Actions Status

```bash
# List recent workflow runs
gh run list --limit 5 --repo himprapatel-rgb/ai-skincare-intelligence-system

# Expected: "completed success" for all runs
# If "failure": Check logs with:
gh run view <run-id> --log-failed
```

### 2. Check Backend Health

```bash
# Production
curl https://pellicura-api.fly.dev/api/health

# Staging  
curl https://pellicura-api-staging.fly.dev/api/health

# Expected response:
# {"status":"healthy","service":"ai-skincare-intelligence-system","database":"ok"}
```

### 3. Check Frontend Accessibility

```bash
# Production
curl -I https://pellicura.com

# Staging
curl -I https://staging.pellicura.pages.dev

# Expected: HTTP 200 OK
```

### 4. Check Fly.io Logs (if backend changed)

```bash
# Production logs
flyctl logs --app pellicura-api -n 50

# Staging logs
flyctl logs --app pellicura-api-staging -n 50

# Look for:
# ✅ "Uvicorn running on..."
# ✅ "Database tables ensured"
# ❌ Any ERROR or CRITICAL messages
```

---

## Common Failure Causes

| Failure | Cause | Fix |
|---------|-------|-----|
| "No access token available" | `FLY_API_TOKEN` not set | Add to GitHub Secrets |
| "CLOUDFLARE_API_TOKEN" error | Token not set | Add to GitHub Secrets |
| "database connection failed" | `DATABASE_URL` wrong | Check Fly.io secrets |
| Build fails | Code error | Check build logs |
| 502 Bad Gateway | App crashed | Check `flyctl logs` |

---

## Required GitHub Secrets

| Secret | How to Get | Status |
|--------|------------|--------|
| `FLY_API_TOKEN` | `fly tokens create deploy -x 999999h` | ⬜ Not Set |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → API Tokens | ⬜ Not Set |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Overview | ⬜ Not Set |

To check if secrets are set:
1. Go to: https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/settings/secrets/actions
2. All three should be listed

---

## Quick Verification Script (PowerShell)

```powershell
# Run this after any deployment to verify everything works

Write-Host "=== Deployment Verification ===" -ForegroundColor Cyan

# 1. Backend Health
Write-Host "`n1. Checking Backend Health..." -ForegroundColor Yellow
$prod = Invoke-RestMethod -Uri "https://pellicura-api.fly.dev/api/health" -ErrorAction SilentlyContinue
$staging = Invoke-RestMethod -Uri "https://pellicura-api-staging.fly.dev/api/health" -ErrorAction SilentlyContinue

if ($prod.status -eq "healthy") {
    Write-Host "   Production Backend: OK" -ForegroundColor Green
} else {
    Write-Host "   Production Backend: FAILED" -ForegroundColor Red
}

if ($staging.status -eq "healthy") {
    Write-Host "   Staging Backend: OK" -ForegroundColor Green
} else {
    Write-Host "   Staging Backend: FAILED" -ForegroundColor Red
}

# 2. Frontend Check
Write-Host "`n2. Checking Frontend..." -ForegroundColor Yellow
try {
    $fe = Invoke-WebRequest -Uri "https://pellicura.com" -Method Head -UseBasicParsing
    Write-Host "   Production Frontend: OK ($($fe.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   Production Frontend: FAILED" -ForegroundColor Red
}

# 3. GitHub Actions
Write-Host "`n3. Checking GitHub Actions..." -ForegroundColor Yellow
Write-Host "   Run: gh run list --limit 3" -ForegroundColor Gray

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
```

---

## AI Assistant Protocol

When deploying code, the AI assistant should:

1. **After `git push`**: Wait 2-3 minutes for CI/CD
2. **Check GitHub Actions**: `gh run list --limit 3`
3. **If failure**: Get logs with `gh run view <id> --log-failed`
4. **Check health endpoints**: Verify backends are healthy
5. **Report status**: Tell user what succeeded/failed

---

## Monitoring Links

| Service | Dashboard |
|---------|-----------|
| GitHub Actions | https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/actions |
| Fly.io | https://fly.io/dashboard |
| Cloudflare Pages | https://dash.cloudflare.com → Pages |
| Railway (DB) | https://railway.app/dashboard |

---

**End of Document**
