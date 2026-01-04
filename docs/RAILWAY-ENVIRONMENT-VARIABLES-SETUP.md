# Railway Environment Variables Setup Guide

**Created:** January 4, 2026, 8 PM GMT  
**Status:** READY FOR CONFIGURATION  
**Estimated Time:** 15 minutes  
**Required:** Before production deployment

---

## Executive Summary

This guide walks through configuring all necessary environment variables on Railway for the AI Skincare Intelligence System. Currently, some variables use development fallback values and need to be updated for production security.

**Critical Variables Missing:**
- ❌ `ENCRYPTION_SALT` (security risk)
- ❌ `ENV=production` (not enforcing production checks)
- ⚠️ `SECRET_KEY` (likely placeholder)

---

## 📋 Complete Environment Variables Reference

### 🔴 CRITICAL - Must Configure

| Variable | Purpose | Current Value | Action | Priority |
|----------|---------|---------------|--------|----------|
| `ENCRYPTION_SALT` | Encryption key derivation | ❌ Missing (dev fallback) | Generate secure random | **P0** |
| `ENV` | Environment mode | ❌ Not set | Set to `production` | **P0** |
| `SECRET_KEY` | JWT signing key | ⚠️ Likely placeholder | Generate secure random | **P0** |
| `DATABASE_URL` | PostgreSQL connection | ✅ Configured on Railway | Verify working | **P0** |

### 🟡 IMPORTANT - Highly Recommended

| Variable | Purpose | Current | Action | Priority |
|----------|---------|---------|--------|----------|
| `ALGORITHM` | JWT algorithm | `HS256` | Verify correct | **P1** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `30` | Adjust as needed | **P1** |
| `DEBUG` | Debug mode | `False` | Ensure `False` | **P1** |
| `ALLOWED_ORIGINS` | CORS origins | `*` | Restrict in prod | **P1** |

### 🟢 OPTIONAL - For Features

| Variable | Purpose | Optional |
|----------|---------|----------|
| `CLOUDINARY_CLOUD_NAME` | Image hosting | Yes (required for file upload) |
| `CLOUDINARY_API_KEY` | Cloudinary auth | Yes (required for file upload) |
| `CLOUDINARY_API_SECRET` | Cloudinary auth | Yes (required for file upload) |
| `GPTGPT_API_KEY` | GPT API (if using) | Yes |

---

## 🚀 Step-by-Step Configuration

### Step 1: Access Railway Dashboard

1. Go to [railway.com](https://railway.com)
2. Sign in with your account
3. Navigate to **Projects** → **ai-skincare-intelligence-system**
4. Select **production** environment
5. Click on **Backend Service** (ai-skincare-intelligence-system)

### Step 2: Access Variables Section

1. Click on **Variables** tab (in the service details)
2. You should see existing variables:
   - DATABASE_URL
   - ALGORITHM
   - ACCESS_TOKEN_EXPIRE_MINUTES
   - DEBUG
   - ALLOWED_ORIGINS

### Step 3: Generate Secure Values

**For ENCRYPTION_SALT:**
```bash
# Generate 32-byte random salt (base64 encoded)
python -c "import secrets; import base64; print(base64.b64encode(secrets.token_bytes(32)).decode())"

# Output example:
# a7F2mK9wL5pX2nQ8vR4bT7yD6hJ1cE3eU5sP9mN2k8oI0rZ7t3xB6v
```

**For SECRET_KEY:**
```bash
# Generate 64-byte secure random key
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Output example:
# FX8dR2k9mL-4pJ5vN3x_8cQ1eT6sU9wY2hA7bD4mK1n0rP3v5xL2z
```

### Step 4: Add/Update Variables in Railway

**Add new variable:**
1. Click **+ New Variable**
2. Enter variable name and value
3. Click **Add**

**Variable 1: ENCRYPTION_SALT**
- **Name:** `ENCRYPTION_SALT`
- **Value:** `[Paste generated value from Step 3]`
- **Click:** Add

**Variable 2: ENV**
- **Name:** `ENV`
- **Value:** `production`
- **Click:** Add

**Variable 3: SECRET_KEY**
- **Name:** `SECRET_KEY`
- **Value:** `[Paste generated value from Step 3]`
- **Click:** Add

### Step 5: Verify Existing Variables

Check these are already configured (if not, add them):

**DEBUG**
- **Value should be:** `False` or `false`
- **NOT:** `True`

**ALGORITHM**
- **Value should be:** `HS256`

**ACCESS_TOKEN_EXPIRE_MINUTES**
- **Value should be:** `30`

**ALLOWED_ORIGINS**
- **Current:** `*` (allow all)
- **Recommended for production:** Restrict to your domain
  - Example: `https://yourdomain.com,https://app.yourdomain.com`

---

## ✅ Verification Checklist

After adding variables:

- [ ] `ENCRYPTION_SALT` = [secure value]
- [ ] `ENV` = `production`
- [ ] `SECRET_KEY` = [secure value]
- [ ] `DEBUG` = `False`
- [ ] `ALGORITHM` = `HS256`
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` = `30`
- [ ] `DATABASE_URL` = Valid PostgreSQL connection (Railway auto-configured)
- [ ] ALLOWED_ORIGINS = Appropriate for environment

---

## 🚀 Deploy with New Variables

**Option 1: Automatic Deployment (Railway)**

1. Click **Deploy** button in Railway
2. Monitor deployment status
3. Check logs for errors

**Option 2: Manual Trigger via Git**

```bash
git add .
git commit -m "chore(env): Update environment variables for production"
git push origin main

# Railway will auto-deploy based on webhook
```

---

## 🔍 Post-Deployment Verification

### Test 1: Health Check
```bash
curl https://ai-skincare-intelligence-system-production.up.railway.app/api/health

# Expected response:
# {"message": "AI Skincare Intelligence System API", "version": "1.0.0"}
```

### Test 2: Check Logs for Errors
1. Open Railway dashboard
2. Select Backend Service
3. Click **Logs** tab
4. Look for errors containing:
   - "Missing ENCRYPTION_SALT" → **FAIL** (not set)
   - "Environment is production" → **PASS** (ENV properly set)
   - "500 Internal Server Error" → Check error message

### Test 3: Test Encrypted Endpoints
```bash
# Test profile endpoint (uses encryption)
curl -X GET https://ai-skincare-intelligence-system-production.up.railway.app/api/v1/profile \
  -H "Authorization: Bearer [token]"

# Should work without encryption errors
```

---

## ⚠️ Security Best Practices

### DO ✅

1. **Use strong random values** for ENCRYPTION_SALT and SECRET_KEY
2. **Never commit** secrets to Git
3. **Rotate secrets** every 90 days
4. **Restrict ALLOWED_ORIGINS** to your domains
5. **Set DEBUG=False** in production
6. **Enable HTTPS** (Railway auto-enables)
7. **Monitor logs** for suspicious activity
8. **Backup** your secret values in secure location

### DON'T ❌

1. **Don't use weak passwords** like "password123"
2. **Don't share secrets** in Slack/email
3. **Don't use dev values** in production
4. **Don't set DEBUG=True** in production
5. **Don't allow CORS from **** in production
6. **Don't check secrets** into version control
7. **Don't reuse secrets** across environments

---

## 🛠️ Troubleshooting

### Issue: "ModuleNotFoundError: decrypt_sensitive_data"

**Cause:** ENCRYPTION_SALT not set  
**Fix:** Add ENCRYPTION_SALT variable with secure value

### Issue: "Production validation failed"

**Cause:** ENV not set to "production"  
**Fix:** Add ENV variable with value "production"

### Issue: Application won't start after adding variables

**Cause:** Syntax error or invalid value  
**Fix:**
1. Check Railway logs for specific error
2. Verify variable names are exact (case-sensitive)
3. Verify values don't contain quotes or special chars
4. Redeploy after fixes

### Issue: "Connection refused" on DATABASE_URL

**Cause:** Database credentials invalid  
**Fix:** Verify DATABASE_URL in Railway matches actual database

---

## 📈 Variable Summary

```
ENCRYPTION_SALT=a7F2mK9wL5pX2nQ8vR4bT7yD6hJ1cE3eU5sP9mN2k8oI0rZ7t3xB6v
ENV=production
SECRET_KEY=FX8dR2k9mL-4pJ5vN3x_8cQ1eT6sU9wY2hA7bD4mK1n0rP3v5xL2z
DEBUG=False
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=[Railway PostgreSQL connection string]
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## 📁 Files Modified

No code files need modification. Only Railway environment variables change.

---

## ⏳ Timeline

| Step | Duration |
|------|----------|
| Generate secure values | 5 min |
| Add variables to Railway | 5 min |
| Deploy backend | 5 min |
| Verify endpoints | 5 min |
| **TOTAL** | **~20 min** |

---

## ✅ Success Criteria

- ✅ ENCRYPTION_SALT set and verified
- ✅ ENV set to "production"
- ✅ SECRET_KEY updated
- ✅ Health endpoint responds 200 OK
- ✅ No encryption errors in logs
- ✅ API endpoints functional
- ✅ Application stable for 5+ minutes

---

## 📚 References

- [Railway Documentation](https://docs.railway.app/)
- [Environment Variables Best Practices](https://12factor.net/config)
- [Python Secrets Module](https://docs.python.org/3/library/secrets.html)

---

**Document Status:** READY FOR CONFIGURATION  
**Last Updated:** January 4, 2026  
**Next Step:** Execute configuration and deploy
