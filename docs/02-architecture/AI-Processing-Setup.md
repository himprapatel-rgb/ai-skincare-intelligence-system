# AI Processing Setup Guide

**Last Updated:** January 29, 2026  
**Status:** Ready for Configuration

---

## Overview

Pellicura uses premium AI models via **Replicate** for:

| Feature | Model | Quality | Cost |
|---------|-------|---------|------|
| Background Removal | RMBG-2.0 | ⭐⭐⭐⭐⭐ | $0.005/image |
| Face Enhancement | CodeFormer | ⭐⭐⭐⭐⭐ | $0.02/image |
| Image Upscaling | Real-ESRGAN | ⭐⭐⭐⭐⭐ | $0.01/image |
| 3D Face Reconstruction | DECA | ⭐⭐⭐⭐⭐ | $0.08/face |

**Total per full pipeline: ~$0.12/image**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI PROCESSING ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   [User Photo]                                                           │
│        │                                                                 │
│        ▼                                                                 │
│   [Frontend] ──────────────────────────────────────────┐                │
│        │                                               │                │
│        ▼                                               ▼                │
│   [Fly.io Backend]                            [Cloudflare R2]           │
│        │                                        (Storage)               │
│        ▼                                                                │
│   [Replicate API]                                                       │
│        │                                                                │
│        ├── RMBG-2.0 (Background)                                        │
│        ├── CodeFormer (Enhancement)                                     │
│        ├── Real-ESRGAN (Upscale)                                        │
│        └── DECA (3D Face)                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### Step 1: Get Replicate API Token

1. Go to https://replicate.com
2. Sign up / Sign in
3. Go to Account Settings → API tokens
4. Create a new token
5. Copy the token (starts with `r8_`)

### Step 2: Create Cloudflare R2 Bucket

1. Go to https://dash.cloudflare.com
2. Select your account
3. Go to R2 → Create bucket
4. Name it: `pellicura-assets`
5. Create R2 API token:
   - Go to R2 → Manage R2 API Tokens
   - Create token with read/write access
   - Save Access Key ID and Secret Access Key

### Step 3: Set Environment Variables

#### For Fly.io (Production/Staging):

```bash
# Replicate API
flyctl secrets set REPLICATE_API_TOKEN="r8_your_token_here" --app pellicura-api

# Cloudflare R2
flyctl secrets set R2_ACCESS_KEY_ID="your_access_key" --app pellicura-api
flyctl secrets set R2_SECRET_ACCESS_KEY="your_secret_key" --app pellicura-api
flyctl secrets set R2_PUBLIC_URL="https://pub-xxx.r2.dev" --app pellicura-api
```

#### For Local Development:

Add to `backend/.env`:

```env
REPLICATE_API_TOKEN=r8_your_token_here
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=pellicura-assets
R2_PUBLIC_URL=https://pub-xxx.r2.dev
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

---

## API Endpoints

### Individual Operations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/ai/remove-background` | POST | Remove background |
| `/api/v1/ai/enhance-face` | POST | Enhance face quality |
| `/api/v1/ai/upscale` | POST | Upscale to 4K |
| `/api/v1/ai/reconstruct-3d` | POST | Generate 3D face model |
| `/api/v1/ai/full-pipeline` | POST | Run all steps |
| `/api/v1/ai/upload-and-process` | POST | Upload file + process |
| `/api/v1/ai/pricing` | GET | Get current pricing |

### Example Request

```bash
curl -X POST https://pellicura-api.fly.dev/api/v1/ai/full-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/photo.jpg",
    "quality": "premium",
    "include_3d": true,
    "save_to_storage": true,
    "user_id": "user_123"
  }'
```

### Example Response

```json
{
  "success": true,
  "total_cost": 0.12,
  "final_image_url": "https://replicate.delivery/xxx/output.png",
  "background_removed_url": "https://replicate.delivery/xxx/bg.png",
  "enhanced_url": "https://replicate.delivery/xxx/enhanced.png",
  "upscaled_url": "https://replicate.delivery/xxx/4k.png",
  "face_3d_url": "https://replicate.delivery/xxx/mesh.obj",
  "storage_urls": {
    "enhanced_image": "https://pub-xxx.r2.dev/enhanced/user_123/xxx.png",
    "background_removed": "https://pub-xxx.r2.dev/backgrounds/user_123/xxx.png"
  }
}
```

---

## Quality Levels

| Level | Models Used | Cost | Use Case |
|-------|-------------|------|----------|
| `fast` | Basic versions | ~$0.04 | Quick preview |
| `balanced` | GFPGAN + rembg | ~$0.06 | Standard use |
| `premium` | CodeFormer + RMBG-2.0 + DECA | ~$0.12 | Best quality |

---

## Cost Estimation

| Monthly Users | Full Pipeline | Without 3D |
|---------------|---------------|------------|
| 100 | $12 | $4 |
| 500 | $60 | $20 |
| 1,000 | $120 | $40 |
| 5,000 | $600 | $200 |

---

## Files Created

| File | Purpose |
|------|---------|
| `backend/app/services/replicate_ai_service.py` | Replicate API integration |
| `backend/app/services/r2_storage_service.py` | Cloudflare R2 storage |
| `backend/app/routers/ai_processing.py` | API endpoints |

---

## Models Used

### RMBG-2.0 (Background Removal)
- **Provider:** Replicate (`lucataco/rmbg-2.0`)
- **Quality:** Best-in-class edge detection
- **Special:** Perfect hair separation, transparent output

### CodeFormer (Face Enhancement)
- **Provider:** Replicate (`sczhou/codeformer`)
- **Quality:** #1 face restoration model
- **Special:** Natural skin texture, handles damage

### Real-ESRGAN (Upscaling)
- **Provider:** Replicate (`nightmareai/real-esrgan`)
- **Quality:** Industry standard 4x upscale
- **Special:** Face enhancement option

### DECA (3D Face)
- **Provider:** Replicate (`cjwbw/deca`)
- **Quality:** Accurate 3D reconstruction
- **Output:** OBJ mesh, texture maps, shape parameters

---

## Troubleshooting

### "API token not configured"
- Set `REPLICATE_API_TOKEN` in environment

### "R2 upload failed"
- Check `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`
- Verify bucket exists and token has write access

### "Model timeout"
- Increase timeout (default 60s)
- Try `balanced` quality for faster processing

---

**End of Document**
