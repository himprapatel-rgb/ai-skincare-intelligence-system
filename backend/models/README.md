# AI Skincare Models Directory

Central model registry and management for the AI Skincare Intelligence System.

## 📂 Directory Structure

```
models/
├── model_registry.yml          # Model metadata and configuration
├── download_models.py          # Download pretrained models (create locally)
├── verify_models.py            # Verify model integrity (create locally)
├── README.md                   # This file
├── .gitignore                  # Git ignore rules
├── _weights/                   # Downloaded models (git-ignored, auto-created)
├── acne_binary_v1.pt          # Custom trained model ✅
├── acne_binary_v1_info.txt    # Model info
├── other_condition_v1.pt      # Custom trained model ✅
└── other_condition_v1_info.txt # Model info
```

## 🎯 Available Models

### Custom Trained Models (In Repo)
- **acne_binary_v1.pt** (2.5MB) - Binary acne classifier
- **other_condition_v1.pt** (3.8MB) - Multi-class condition classifier

### Pretrained Models (Download on Demand)
- **YuNet** (1.2MB, MIT) - Fast face detection
- **RetinaFace-MobileNet** (3.5MB, MIT) - Face + 5 landmarks
- **MediaPipe Face Mesh** (pip package, Apache-2.0) - 468 facial landmarks
- **MobileNetV3** (17MB, BSD-3) - Transfer learning base
- **DenseNet-201** (80MB, BSD-3) - High accuracy base

All models are **commercial-safe** (MIT, Apache-2.0, BSD-3 licenses).

## 🚀 Quick Start

### Option 1: Auto-Download (Railway Deployment)

Set environment variable:
```bash
AUTO_DOWNLOAD_MODELS=true
```

Models download automatically on first use.

### Option 2: Manual Download (Local Development)

**NOTE:** The Python scripts need to be created locally first. Full implementation is in `/docs/ML-INFERENCE-INTEGRATION.md`

```bash
cd backend

# After creating download_models.py locally:
python -m models.download_models --required

# Verify integrity:
python -m models.verify_models
```

### Option 3: Using Model Loader

```python
from app.services.model_loader import get_model_loader

loader = get_model_loader()

# Get model info
info = loader.get_model_info("acne_binary_v1")

# Get model path
path = loader.get_model_path("yunet_face_detection")

# Load model (with caching)
model = loader.load_model("acne_binary_v1")
```

## 📋 Model Registry

All model metadata is in `model_registry.yml`:
- Download URLs
- Licenses
- Sizes and checksums
- Input/output specifications
- Performance metrics
- Usage guidelines

## 🐳 Railway Deployment

### Environment Variables

```bash
MODEL_DIR=/app/models/_weights
AUTO_DOWNLOAD_MODELS=true
ACNE_MODEL_PATH=/app/models/acne_binary_v1.pt
OTHER_CONDITION_MODEL_PATH=/app/models/other_condition_v1.pt
```

### Deployment Flow

1. Railway clones repo (custom models included)
2. `_weights/` directory created automatically
3. Pretrained models download on first request (if AUTO_DOWNLOAD=true)
4. Models cached for subsequent requests

## 🔒 Licensing

| License | Models | Commercial |
|---|---|---|
| MIT | YuNet, RetinaFace, Custom | ✅ YES |
| Apache-2.0 | MediaPipe | ✅ YES |
| BSD-3 | MobileNetV3, DenseNet | ✅ YES |

All models verified for commercial use.

## 📝 Implementation Files

The following Python scripts are documented in `/docs/ML-INFERENCE-INTEGRATION.md` for local creation:

1. **download_models.py** (180 lines)
   - Downloads models from registry
   - Progress tracking
   - Checksum verification

2. **verify_models.py** (150 lines)
   - Integrity checks
   - Generates checksums

3. **Backend Integration**:
   - `app/core/config.py` - Add MODEL_DIR variables
   - `app/services/model_loader.py` - Central loader with caching

## 📖 Documentation

- **Registry**: `model_registry.yml` - Complete model metadata
- **ML Integration**: `/docs/ML-INFERENCE-INTEGRATION.md` - Full guide
- **Scripts**: See documentation for complete implementation

## ⚠️ Important Notes

1. **Pretrained models are NOT in GitHub** - They download to `_weights/` on demand
2. **Custom models ARE in GitHub** - acne_binary_v1.pt and other_condition_v1.pt
3. **Python scripts** - Create locally using implementation guide
4. **Railway** - Set AUTO_DOWNLOAD_MODELS=true for automatic setup

## 🆘 Support

For implementation questions, see:
- `/docs/ML-INFERENCE-INTEGRATION.md` - Complete integration guide
- `model_registry.yml` - Model specifications
- GitHub Issues - Bug reports and feature requests
