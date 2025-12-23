# 🚀 Implementation Guide: Story 16.1 - Railway Volume Configuration

**Epic 16**: External Pre-Trained ML Model Integration  
**Story**: 16.1 - Configure Railway Volume for ML Models  
**Priority**: Critical (Foundation Task)  
**Estimated Time**: 30-45 minutes  
**Status**: In Progress

---

## 📋 Story Requirements

Create and mount a Railway persistent volume for the backend service to store external ML models with proper configuration and documentation.

**Acceptance Criteria**:
- ✅ Railway persistent volume created
- ✅ Volume mounted to backend service at `/app/model_cache`
- ✅ Volume size: 10GB (expandable)
- ✅ Mount path documented
- ✅ Environment variables configured
- ✅ Permissions validated

---

## 🎯 Step-by-Step Implementation

### Step 1: Access Railway Project

1. Go to https://railway.app/
2. Log in to your account
3. Navigate to the "ai-skincare-intelligence-system" project
4. Select the **backend service**

### Step 2: Create Persistent Volume

**Via Railway Dashboard**:

1. Click on your backend service
2. Go to the **"Volumes"** tab (or **"Settings" → "Volumes"**)
3. Click **"+ New Volume"**
4. Configure the volume:
   ```
   Volume Name: model-cache
   Mount Path: /app/model_cache
   Size: 10GB
   ```
5. Click **"Create Volume"**

**Via Railway CLI** (Alternative):
```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Create volume
railway volume create model-cache --mount /app/model_cache --size 10
```

### Step 3: Configure Environment Variables

Add these environment variables to your Railway backend service:

```bash
# Model Storage Configuration
EXTERNAL_MODEL_CACHE_DIR=/app/model_cache
MODEL_CACHE_TTL_HOURS=24
MODEL_CACHE_MAX_SIZE_GB=10

# Model Loading Configuration
MODEL_LOAD_TIMEOUT_SECONDS=30
MODEL_WARMUP_ON_STARTUP=false
```

**How to Add**:
1. In Railway dashboard → Backend Service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add each variable above
5. Click **"Deploy"** to apply changes

### Step 4: Update Backend Code

**Create `backend/app/config/storage.py`**:

```python
import os
from pathlib import Path

class StorageConfig:
    """Configuration for ML model storage"""
    
    # Volume mount path
    MODEL_CACHE_DIR = Path(os.getenv("EXTERNAL_MODEL_CACHE_DIR", "/app/model_cache"))
    
    # Cache settings
    CACHE_TTL_HOURS = int(os.getenv("MODEL_CACHE_TTL_HOURS", "24"))
    CACHE_MAX_SIZE_GB = int(os.getenv("MODEL_CACHE_MAX_SIZE_GB", "10"))
    
    # Loading settings
    LOAD_TIMEOUT = int(os.getenv("MODEL_LOAD_TIMEOUT_SECONDS", "30"))
    WARMUP_ON_STARTUP = os.getenv("MODEL_WARMUP_ON_STARTUP", "false").lower() == "true"
    
    @classmethod
    def ensure_cache_dir_exists(cls):
        """Create cache directory if it doesn't exist"""
        cls.MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        print(f"✅ Model cache directory ready: {cls.MODEL_CACHE_DIR}")
    
    @classmethod
    def get_cache_stats(cls):
        """Get cache directory statistics"""
        if not cls.MODEL_CACHE_DIR.exists():
            return {"size_mb": 0, "files": 0}
        
        total_size = sum(f.stat().st_size for f in cls.MODEL_CACHE_DIR.rglob('*') if f.is_file())
        file_count = sum(1 for _ in cls.MODEL_CACHE_DIR.rglob('*') if _.is_file())
        
        return {
            "size_mb": round(total_size / (1024 * 1024), 2),
            "files": file_count,
            "path": str(cls.MODEL_CACHE_DIR)
        }

# Initialize on import
StorageConfig.ensure_cache_dir_exists()
```

**Update `backend/app/main.py`** (add startup check):

```python
from fastapi import FastAPI
from app.config.storage import StorageConfig

app = FastAPI(title="AI Skincare Intelligence System")

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    print("🚀 Starting AI Skincare Intelligence System...")
    
    # Ensure model cache directory exists
    StorageConfig.ensure_cache_dir_exists()
    
    # Log cache stats
    stats = StorageConfig.get_cache_stats()
    print(f"📊 Model cache stats: {stats}")

@app.get("/health")
async def health_check():
    """Health check endpoint with cache info"""
    cache_stats = StorageConfig.get_cache_stats()
    return {
        "status": "healthy",
        "model_cache": cache_stats
    }
```

### Step 5: Test Volume Configuration

**Test 1: Volume Mount Verification**

Deploy your changes and run:

```bash
# Via Railway CLI
railway run bash

# Inside container, check mount
ls -la /app/model_cache
df -h /app/model_cache
```

**Expected Output**:
```
total 8
drwxr-xr-x 2 root root 4096 Dec 23 23:00 .
drwxr-xr-x 1 root root 4096 Dec 23 23:00 ..

Filesystem      Size  Used Avail Use% Mounted on
/dev/disk       10G   0    10G   0%  /app/model_cache
```

**Test 2: Write Test**

```python
# Test file creation
import os
test_file = "/app/model_cache/test.txt"
with open(test_file, "w") as f:
    f.write("Railway volume test")

print(f"✅ Write test successful: {os.path.exists(test_file)}")
os.remove(test_file)
```

**Test 3: Health Endpoint**

```bash
curl https://your-backend.railway.app/health

# Expected:
{
  "status": "healthy",
  "model_cache": {
    "size_mb": 0,
    "files": 0,
    "path": "/app/model_cache"
  }
}
```

### Step 6: Document Volume Configuration

**Update Railway Project README** (create if doesn't exist):

```markdown
## Railway Infrastructure

### Persistent Volumes

#### model-cache
- **Purpose**: Store external pre-trained ML models
- **Mount Path**: `/app/model_cache`
- **Size**: 10GB (expandable to 50GB)
- **Retention**: Persistent across deploys
- **Backup**: Manual snapshots recommended

**Environment Variables**:
- `EXTERNAL_MODEL_CACHE_DIR=/app/model_cache`
- `MODEL_CACHE_TTL_HOURS=24`
- `MODEL_CACHE_MAX_SIZE_GB=10`
```

---

## ✅ Validation Checklist

Before marking Story 16.1 as complete:

- [ ] Volume created in Railway dashboard
- [ ] Volume shows 10GB size
- [ ] Mount path is `/app/model_cache`
- [ ] Environment variables configured
- [ ] Backend code updated with StorageConfig
- [ ] Health endpoint returns cache stats
- [ ] Write test passes
- [ ] Documentation updated
- [ ] Volume persists after redeploy

---

## 🐛 Troubleshooting

### Issue: Volume not mounted

**Symptoms**: Directory doesn't exist or shows 0 space

**Solution**:
```bash
# Check Railway logs
railway logs

# Verify volume configuration
railway volume list

# Recreate volume if needed
railway volume delete model-cache
railway volume create model-cache --mount /app/model_cache --size 10
```

### Issue: Permission denied

**Symptoms**: Can't write to `/app/model_cache`

**Solution**:
```dockerfile
# Add to Dockerfile
RUN mkdir -p /app/model_cache && chmod 777 /app/model_cache
```

### Issue: Volume full

**Symptoms**: "No space left on device"

**Solution**:
1. Railway Dashboard → Volumes → model-cache
2. Click "Resize"
3. Increase to 20GB or 50GB
4. Redeploy service

---

## 📊 Success Metrics

- ✅ Volume operational within 30 minutes
- ✅ Health endpoint returns cache stats
- ✅ Zero deployment failures
- ✅ Volume persists across 3+ redeploys

---

## 🔗 Next Steps

Once Story 16.1 is complete:

1. **Story 16.2**: Implement Model Loader Service
2. **Story 16.3**: Build external download & cache mechanism
3. Test model downloading to volume
4. Monitor volume usage

---

## 📖 References

- [Railway Volumes Documentation](https://docs.railway.app/reference/volumes)
- [Configuration Guide](./CONFIGURATION-GUIDE-EXTERNAL-ML-MODELS.md)
- [SRS V5.3](./AI-Skincare-Intelligence-System-SRS-V5.3-EXTERNAL-PRETRAINED-ML.md)
- [Product Backlog](./Product-Backlog-V5.md) - Story 16.1

---

**Story Owner**: DevOps & Backend Team  
**Last Updated**: December 23, 2025, 11:00 PM GMT  
**Status**: ✅ Ready for Implementation
