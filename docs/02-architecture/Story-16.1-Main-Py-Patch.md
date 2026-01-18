# 🔧 main.py Integration Patch - Story 16.1

**Epic 16**: External Pre-Trained ML Model Integration  
**Story**: 16.1 - Configure Railway Volume for ML Models  
**File**: `backend/app/main.py`  
**Status**: Ready to Apply

---

## 📋 Overview

This document provides the exact code changes needed to integrate StorageConfig into the FastAPI main.py file.

---

## ✅ Step 1: Add Import

**Location**: After line 14 (after `from app.models.twin_models import *`)

**Add this line**:
```python
from app.config.storage import StorageConfig  # Epic 16: ML model cache
```

**Full import section should look like**:
```python
from app.api.v1.routines import router as routines_router
from app.api.v1.progress import router as progress_router
from app.api.v1.products import router as external_products_router
from app.routers import products
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1 import api_router
from app.database import engine, Base
from app.routers import scan, digital_twin
from app.routers import admin
from app.routers import consent, profile  # GDPR & User Management
from app.models.twin_models import *  # Import Digital Twin models for table creation# Create database tables
from app.config.storage import StorageConfig  # Epic 16: ML model cache
```

---

## ✅ Step 2: Add Startup Event

**Location**: After the `app.add_middleware()` section (around line 29), before the route definitions

**Add this code**:
```python
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup - Epic 16: ML model cache"""
    print("🚀 Starting AI Skincare Intelligence System...")
    
    # Ensure model cache directory exists
    try:
        StorageConfig.ensure_cache_dir_exists()
        
        # Log cache stats
        stats = StorageConfig.get_cache_stats()
        print(f"📊 Model cache initialized:")
        print(f"   Path: {stats['path']}")
        print(f"   Size: {stats['size_mb']} MB")
        print(f"   Files: {stats['files']}")
        print(f"   Available: {stats.get('available_space_gb', 'N/A')} GB")
        
        # Test write access
        if StorageConfig.is_cache_available():
            print("✅ Model cache is ready and writable")
        else:
            print("⚠️  Model cache is not writable - check volume configuration")
            
    except Exception as e:
        print(f"❌ Error initializing model cache: {e}")
        print("⚠️  Application will start but external models may not work")
```

---

## ✅ Step 3: Update Health Endpoint

**Location**: Find the existing `@app.get("/api/health")` or `health_check` function

**Replace the existing health check with**:
```python
@app.get("/api/health")
async def health_check():
    """Enhanced health check with model cache info - Epic 16"""
    try:
        cache_stats = StorageConfig.get_cache_stats()
        cache_available = StorageConfig.is_cache_available()
        
        return {
            "status": "healthy",
            "service": "ai-skincare-intelligence-system",
            "version": settings.APP_VERSION,
            "model_cache": {
                "path": cache_stats.get("path"),
                "size_mb": cache_stats.get("size_mb"),
                "files": cache_stats.get("files"),
                "available_space_gb": cache_stats.get("available_space_gb"),
                "writable": cache_available,
                "status": "operational" if cache_available else "unavailable"
            }
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": "ai-skincare-intelligence-system",
            "version": settings.APP_VERSION,
            "model_cache": {
                "status": "error",
                "error": str(e)
            }
        }
```

---

## 📝 Complete Modified main.py (Relevant Sections)

```python
# ... existing imports ...
from app.config.storage import StorageConfig  # Epic 16: ML model cache

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered skincare intelligence system",
    debug=settings.DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup - Epic 16: ML model cache"""
    print("🚀 Starting AI Skincare Intelligence System...")
    
    # Ensure model cache directory exists
    try:
        StorageConfig.ensure_cache_dir_exists()
        
        # Log cache stats
        stats = StorageConfig.get_cache_stats()
        print(f"📊 Model cache initialized:")
        print(f"   Path: {stats['path']}")
        print(f"   Size: {stats['size_mb']} MB")
        print(f"   Files: {stats['files']}")
        print(f"   Available: {stats.get('available_space_gb', 'N/A')} GB")
        
        # Test write access
        if StorageConfig.is_cache_available():
            print("✅ Model cache is ready and writable")
        else:
            print("⚠️  Model cache is not writable - check volume configuration")
            
    except Exception as e:
        print(f"❌ Error initializing model cache: {e}")
        print("⚠️  Application will start but external models may not work")

@app.get("/api/health")
async def health_check():
    """Enhanced health check with model cache info - Epic 16"""
    try:
        cache_stats = StorageConfig.get_cache_stats()
        cache_available = StorageConfig.is_cache_available()
        
        return {
            "status": "healthy",
            "service": "ai-skincare-intelligence-system",
            "version": settings.APP_VERSION,
            "model_cache": {
                "path": cache_stats.get("path"),
                "size_mb": cache_stats.get("size_mb"),
                "files": cache_stats.get("files"),
                "available_space_gb": cache_stats.get("available_space_gb"),
                "writable": cache_available,
                "status": "operational" if cache_available else "unavailable"
            }
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": "ai-skincare-intelligence-system",
            "version": settings.APP_VERSION,
            "model_cache": {
                "status": "error",
                "error": str(e)
            }
        }

# ... rest of routes ...
```

---

## 🧪 Testing After Integration

### Test 1: Startup Logs

After deploying, check Railway logs for:

```
🚀 Starting AI Skincare Intelligence System...
✅ Model cache directory ready: /app/model_cache
📊 Model cache initialized:
   Path: /app/model_cache
   Size: 0.0 MB
   Files: 0
   Available: 9.8 GB
✅ Model cache is ready and writable
```

### Test 2: Health Endpoint

```bash
curl https://your-backend.railway.app/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "ai-skincare-intelligence-system",
  "version": "5.3",
  "model_cache": {
    "path": "/app/model_cache",
    "size_mb": 0.0,
    "files": 0,
    "available_space_gb": 9.8,
    "writable": true,
    "status": "operational"
  }
}
```

### Test 3: Volume Persistence

Test that the volume persists across deployments:

```bash
# Create a test file
railway run bash
echo "test" > /app/model_cache/test.txt
exit

# Redeploy
railway up

# Check file still exists
railway run bash
cat /app/model_cache/test.txt  # Should print "test"
```

---

## ✅ Validation Checklist

- [ ] Import added to main.py
- [ ] Startup event added and working
- [ ] Health endpoint updated
- [ ] Railway logs show cache initialization
- [ ] Health endpoint returns cache stats
- [ ] Cache directory is writable
- [ ] Volume persists across redeploys
- [ ] No errors in application startup

---

## 🚀 Deployment Steps

1. Apply the code changes to `backend/app/main.py`
2. Commit and push to GitHub:
   ```bash
   git add backend/app/main.py
   git commit -m "feat(epic-16): Integrate StorageConfig with main.py - Story 16.1"
   git push
   ```
3. Railway will auto-deploy
4. Check logs for successful initialization
5. Test health endpoint
6. Mark Story 16.1 as **COMPLETE**

---

## 🐛 Troubleshooting

### Issue: "Model cache not writable"

**Solution**: Ensure Railway volume is properly mounted:
```bash
railway volume list
# Should show model-cache mounted at /app/model_cache
```

### Issue: "Module 'app.config.storage' not found"

**Solution**: Ensure `backend/app/config/__init__.py` exists:
```python
# backend/app/config/__init__.py (create if missing)
```

### Issue: Health endpoint returns error

**Solution**: Check that all environment variables are set in Railway.

---

## 🔗 Related Documents

- [IMPLEMENTATION-GUIDE-STORY-16.1-RAILWAY-VOLUME.md](./IMPLEMENTATION-GUIDE-STORY-16.1-RAILWAY-VOLUME.md)
- [backend/app/config/storage.py](../backend/app/config/storage.py)
- [CONFIGURATION-GUIDE-EXTERNAL-ML-MODELS.md](./CONFIGURATION-GUIDE-EXTERNAL-ML-MODELS.md)

---

**Story Owner**: Backend Team  
**Last Updated**: December 24, 2025, 12:00 AM GMT  
**Status**: ✅ Ready to Apply
