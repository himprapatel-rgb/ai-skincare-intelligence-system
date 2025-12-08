# 🚀 Deployment Checklist & Setup Guide

**Last Updated**: December 8, 2025

## ✅ Deployment Status

### Frontend (GitHub Pages)
- [x] GitHub Actions workflow created
- [x] Vite config updated with base path
- [ ] **ACTION REQUIRED**: Enable GitHub Pages in repository settings
- [ ] Verify deployment at: `https://himprapatel-rgb.github.io/ai-skincare-intelligence-system/`

### Backend (Railway)
- [x] Railway configuration files created (`railway.toml`, `railway.json`)
- [x] Dockerfile configured correctly
- [x] CORS origins updated with GitHub Pages URL
- [ ] **ACTION REQUIRED**: Set environment variables in Railway dashboard
- [ ] Verify API health at: `https://ai-skincare-intelligence-system-production.up.railway.app/api/health`

### Database (Railway PostgreSQL)
- [x] Railway PostgreSQL service
- [ ] **ACTION REQUIRED**: Verify DATABASE_URL is set in Railway

---

## 🔧 Step-by-Step Setup

### 1. Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Under "Source", select **GitHub Actions**
3. Save changes
4. The workflow will auto-deploy on next push to `main` branch

### 2. Configure Railway Environment Variables

Go to Railway dashboard → Your project → Backend service → Variables tab

**Required Variables:**
```bash
# Database (automatically set by Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Security (IMPORTANT: Change in production!)
SECRET_KEY=your-super-secret-key-min-32-characters

# Application
APP_NAME=AI Skincare Intelligence System
APP_VERSION=1.0.0
DEBUG=false

# Optional: AI Services
GPTGPT_API_KEY=your-ai-api-key
SUMMARY_TOKEN=your-summary-token
```

**How to set variables:**
1. Railway Dashboard → Backend Service → Variables
2. Click "New Variable"
3. Add each variable name and value
4. Railway will auto-redeploy after changes

### 3. Fix Railway Backend Startup

**Current Issue**: Backend deploys but doesn't start (502 error)

**Root Causes & Solutions:**

#### ✅ A. Environment Variables Missing
```bash
# In Railway dashboard, verify these are set:
DATABASE_URL  # Should auto-populate from PostgreSQL service
SECRET_KEY    # Must be set manually
```

#### ✅ B. Port Binding
The Dockerfile already correctly uses `$PORT` from Railway:
```dockerfile
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

#### ✅ C. Database Connection
If DATABASE_URL is not set, the app might fail to start. Check:
1. Railway Dashboard → PostgreSQL service → Connect tab
2. Copy `DATABASE_URL` variable reference
3. Add to backend service variables: `DATABASE_URL=${{Postgres.DATABASE_URL}}`

### 4. Trigger Deployments

**Backend (Railway)**:
- Push any change to `main` branch in `/backend/**` folder
- Or manually trigger: Railway Dashboard → Deployments → "Deploy"

**Frontend (GitHub Pages)**:
- Push any change to `main` branch in `/frontend/**` folder
- Or manually trigger: Actions tab → "Deploy Frontend to GitHub Pages" → "Run workflow"

---

## 🔍 Verification Steps

### 1. Test Backend Health
```bash
curl https://ai-skincare-intelligence-system-production.up.railway.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "ai-skincare-intelligence-system"
}
```

### 2. Test Backend API Docs
Visit: `https://ai-skincare-intelligence-system-production.up.railway.app/docs`

### 3. Test Frontend
Visit: `https://himprapatel-rgb.github.io/ai-skincare-intelligence-system/`

### 4. Test Frontend → Backend Connection
- Open frontend in browser
- Open Developer Console (F12)
- Check for CORS errors
- Verify API calls reach Railway backend

---

## 🐛 Troubleshooting

### Backend: 502 Bad Gateway

**Check Railway Logs:**
1. Railway Dashboard → Backend Service → Deployments
2. Click latest deployment
3. View "Deploy Logs" and "Application Logs"

**Common Fixes:**
- Missing `DATABASE_URL` environment variable
- Missing `SECRET_KEY` environment variable
- Database not connected to backend service
- Port binding issue (check Dockerfile CMD)

### Frontend: 404 Not Found on GitHub Pages

**Solution:**
1. Check GitHub Actions workflow ran successfully
2. Verify GitHub Pages is enabled in Settings
3. Check `vite.config.ts` has correct base path
4. Wait 2-3 minutes for GitHub Pages DNS to update

### Frontend: CORS Errors

**Solution:**
Backend `config.py` already includes GitHub Pages origin:
```python
ALLOWED_ORIGINS: list[str] = [
    "https://himprapatel-rgb.github.io",
    ...
]
```

If still blocked:
1. Verify backend is running (check health endpoint)
2. Check browser console for exact CORS error
3. Verify frontend is making requests to correct Railway URL

### Database Connection Failed

**Check:**
1. Railway Dashboard → PostgreSQL service is running (green)
2. Backend service has DATABASE_URL variable set
3. Variable reference is correct: `${{Postgres.DATABASE_URL}}`

**Test Connection:**
```bash
# In Railway backend service shell
echo $DATABASE_URL
```

---

## 📋 Deployment URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend (Web)** | https://himprapatel-rgb.github.io/ai-skincare-intelligence-system/ | 🟡 Pending setup |
| **Backend API** | https://ai-skincare-intelligence-system-production.up.railway.app | 🟡 Needs env vars |
| **API Docs** | https://ai-skincare-intelligence-system-production.up.railway.app/docs | 🟡 Needs env vars |
| **Health Check** | https://ai-skincare-intelligence-system-production.up.railway.app/api/health | 🟡 Needs env vars |
| **Database** | Internal Railway network | ✅ Running |

---

## 🎯 Next Steps (Priority Order)

1. **IMMEDIATE**
   - [ ] Enable GitHub Pages in repository settings
   - [ ] Set Railway environment variables (DATABASE_URL, SECRET_KEY)
   - [ ] Verify backend health endpoint responds
   - [ ] Verify frontend deploys to GitHub Pages

2. **SHORT-TERM** (This Week)
   - [ ] Test end-to-end user flow (signup → scan → results)
   - [ ] Set up monitoring/alerts in Railway
   - [ ] Configure custom domain (optional)

3. **MEDIUM-TERM** (Next 2 Weeks)
   - [ ] Load testing
   - [ ] Security audit
   - [ ] Performance optimization

---

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **GitHub Pages**: https://docs.github.com/pages
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **FastAPI on Railway**: https://railway.app/template/fastapi

---

**Status**: Configuration files created, awaiting environment variable setup in Railway.
