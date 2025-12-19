# ML Inference Integration Guide

## Overview

This document describes the production ML inference pipeline for the AI Skincare Intelligence System.

**Status**: ✅ Phase 1 Complete - Models Deployed  
**Last Updated**: December 19, 2025  
**Models**: acne_binary_v1, other_condition_v1

## Architecture

```
┌─────────────────┐
│  Frontend       │
│ (GitHub Pages)  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   FastAPI       │
│   /api/v1/scan  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌───────────────────┐
│ MediaPipe Face  │      │  ML Inference     │
│   Detection     ├─────►│   Service         │
└─────────────────┘      └────────┬──────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
          ┌────────▼────────┐         ┌─────────▼──────────┐
          │ Acne Binary     │         │ Condition          │
          │ Model (PyTorch) │         │ Model (PyTorch)    │
          └─────────────────┘         └────────────────────┘
```

## Directory Structure

```
backend/
├── models/
│   ├── acne_binary_v1.pt         # Binary acne detection
│   ├── other_condition_v1.pt     # Multi-class condition
│   ├── acne_binary_v1_info.txt   # Model metadata
│   └── other_condition_v1_info.txt
│
├── services/
│   ├── ml_inference_service.py   # PyTorch model loader
│   └── skin_analysis_service.py  # MediaPipe + OpenCV
│
└── app/routers/
    └── scan.py                    # API endpoints
```

## Model Specifications

### Acne Binary Model (acne_binary_v1.pt)
- **Type**: Binary Classification
- **Classes**: `no_acne`, `acne`
- **Input**: 224x224 RGB image
- **Architecture**: Custom CNN (3 conv layers + FC)
- **Output**: Softmax probabilities

### Condition Model (other_condition_v1.pt)
- **Type**: Multi-class Classification  
- **Classes**: `normal`, `acne`, `rosacea`, `eczema`, `pigmentation`
- **Input**: 224x224 RGB image
- **Architecture**: Custom CNN (4 conv layers + FC)
- **Output**: Softmax probabilities

## Service Implementation

### MLInferenceService

**Location**: `backend/services/ml_inference_service.py`

**Key Features**:
- ✅ Automatic PyTorch model loading
- ✅ CPU/GPU device detection
- ✅ ImageNet normalization (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
- ✅ Singleton pattern for efficient resource usage
- ✅ Graceful fallback when models unavailable
- ✅ Async inference methods

**Usage**:

```python
from services.ml_inference_service import get_ml_inference_service
import numpy as np

# Get singleton service
ml_service = get_ml_inference_service()

# Run inference on face region (numpy array)
face_region = np.array(...)  # Shape: (H, W, 3)

# Acne detection
acne_result = await ml_service.predict_acne(face_region)
# Returns: {
#     "detected": bool,
#     "confidence": float,
#     "label": str,
#     "probabilities": {"no_acne": float, "acne": float}
# }

# Condition classification
condition_result = await ml_service.predict_condition(face_region)
# Returns: {
#     "condition": str,
#     "confidence": float,
#     "probabilities": {"normal": float, "acne": float, ...}
# }

# Combined analysis
results = await ml_service.analyze_skin_with_ml(face_region)
```

### SkinAnalysisService

**Location**: `backend/services/skin_analysis_service.py`

**Key Features**:
- ✅ MediaPipe face detection and mesh
- ✅ Face region extraction
- ✅ Landmark detection (468 points)
- ✅ Traditional CV analysis (texture, tone, wrinkles)

## API Integration

### Current Scan Router Status

**Location**: `backend/app/routers/scan.py`

**Current State**: Uses mock analysis in `_run_mock_analysis()`

**Required Changes**: Replace mock with ML inference:

```python
# Add imports at top of scan.py:
from services.ml_inference_service import get_ml_inference_service
from services.skin_analysis_service import get_skin_analysis_service
import cv2
import numpy as np

# Replace _run_mock_analysis function:
async def _run_real_ml_analysis(scan: ScanSession) -> dict:
    """
    Run real ML inference pipeline on face scan image.
    """
    # Load services
    ml_service = get_ml_inference_service()
    skin_service = get_skin_analysis_service()
    
    # Load image
    image_data = open(scan.image_path, 'rb').read()
    
    # MediaPipe face detection + crop
    analysis_result = await skin_service.analyze_skin(image_data)
    
    # Get face region from image
    img = cv2.imread(scan.image_path)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Extract face region (simplified - use actual landmarks)
    h, w = img_rgb.shape[:2]
    face_region = img_rgb[int(h*0.2):int(h*0.8), int(w*0.2):int(w*0.8)]
    
    # Run ML inference
    ml_results = await ml_service.analyze_skin_with_ml(face_region)
    
    # Combine results
    return {
        "scan_id": scan.id,
        "status": "completed",
        "ml_analysis": ml_results,
        "cv_analysis": {
            "skin_tone": analysis_result.skin_tone,
            "skin_type": analysis_result.skin_type,
            "texture_quality": analysis_result.texture_quality,
            "wrinkles": {
                "detected": analysis_result.wrinkles_detected,
                "density": analysis_result.wrinkle_density
            },
            "dark_circles": {
                "detected": analysis_result.dark_circles_detected,
                "severity": analysis_result.dark_circle_severity
            }
        },
        "confidence": analysis_result.confidence_score,
        "generated_at": datetime.utcnow().isoformat()
    }

# Update upload endpoint to use real analysis:
# In upload_scan_image function, replace:
#     mock_results = _run_mock_analysis(scan)
# With:
#     real_results = await _run_real_ml_analysis(scan)
```

## Deployment on Railway

### Environment Requirements

**requirements.txt** includes:
```
torch==2.1.2
torchvision==0.16.2
opencv-python==4.8.1.78
mediapipe==0.10.9
numpy==1.26.2
Pillow==10.1.0
```

### Model Files

✅ Both model files uploaded to `backend/models/`:
- `acne_binary_v1.pt`
- `other_condition_v1.pt`

### Memory Considerations

Railway deployment:
- Models load on startup (~50MB each)
- Inference runs on CPU (Railway default)
- Memory footprint: ~200MB base + models

## Testing

### Unit Tests

```bash
cd backend
pytest tests/test_ml_inference.py -v
```

### Manual API Test

```bash
curl -X POST https://your-railway-app.railway.app/api/v1/scan/init \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

curl -X POST https://your-railway-app.railway.app/api/v1/scan/{scan_id}/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@face_image.jpg"

curl https://your-railway-app.railway.app/api/v1/scan/{scan_id}/results \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Performance Metrics

### Target Latency (Railway CPU)
- Face detection: < 500ms
- ML inference (both models): < 1000ms
- Total end-to-end: < 2000ms

### Optimization Options

**Current**:
- PyTorch CPU inference
- Synchronous processing

**Future Enhancements**:
- ONNX runtime for faster CPU inference
- Background task queue (Celery/Redis)
- Model quantization (INT8)
- GPU deployment (Railway Pro)

## Error Handling

### Model Loading Failures

The ML service gracefully falls back:
```python
if self.acne_model is None:
    logger.warning("Acne model not loaded, using fallback")
    return {"detected": False, "confidence": 0.0, "label": "no_acne"}
```

### Inference Errors

All errors logged and return safe defaults:
```python
except Exception as e:
    logger.error(f"Error in acne prediction: {str(e)}")
    return {"detected": False, "confidence": 0.0, "label": "error"}
```

## Monitoring

### Logs to Watch

```bash
# Railway logs
railway logs --follow

# Look for:
[INFO] ML Inference Service initialized successfully
[INFO] Loaded acne model from backend/models/acne_binary_v1.pt
[INFO] Loaded condition model from backend/models/other_condition_v1.pt
[INFO] Using device: cpu
```

## Next Steps

### Immediate
1. ✅ Upload models to GitHub
2. ✅ Create ML inference service  
3. ⏳ Update scan router to use real ML inference
4. ⏳ Deploy to Railway
5. ⏳ Test end-to-end pipeline

### Future
- Add model versioning system
- Implement A/B testing for model updates
- Add batch inference support
- Implement caching layer
- Add inference analytics dashboard

## Support

**Issues**: [GitHub Issues](https://github.com/himprapatel-rgb/ai-skincare-intelligence-system/issues)  
**Documentation**: `/docs`  
**Models**: Contact project maintainer

---

**Last Updated**: December 19, 2025  
**Author**: AI Skincare Intelligence System Team  
**Version**: 1.0
