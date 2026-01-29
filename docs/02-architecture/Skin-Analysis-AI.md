# Skin Analysis AI Architecture

**Last Updated:** January 26, 2026  
**Version:** 1.0

---

## Overview

Pellicura uses AI to analyze skin photos and provide personalized skincare recommendations. This is a **skincare intelligence app**, not a photo editor.

---

## AI Capabilities

### 1. OpenAI Vision API (Primary)

Uses GPT-4 Vision to analyze skin photos for cosmetic signals.

**Detected Signals (0-100 scores):**
| Signal | Description |
|--------|-------------|
| `acne` | Active breakouts, pimples, blemishes |
| `redness` | Skin redness, irritation, rosacea indicators |
| `pigmentation` | Dark spots, uneven skin tone, hyperpigmentation |
| `dehydration` | Skin dryness, lack of moisture |
| `sensitivity` | Reactive skin, irritation prone |
| `wrinkles` | Fine lines, deep wrinkles, aging signs |
| `pores` | Pore visibility, enlarged pores |
| `dark_circles` | Under-eye darkness |
| `texture` | Skin texture quality, smoothness |
| `oiliness` | Excess oil, shine |

**Output Schema:**
```json
{
  "summary": {
    "overall_score": 75,
    "scores": {
      "acne": 20,
      "redness": 15,
      "pigmentation": 30,
      "dehydration": 25,
      "sensitivity": 10,
      "wrinkles": 15,
      "pores": 35,
      "dark_circles": 20,
      "texture": 40,
      "oiliness": 25
    },
    "concerns": ["enlarged pores", "uneven texture"]
  },
  "skin_type": "combination",
  "fitzpatrick_scale": 3,
  "confidence_score": 0.85,
  "concerns_detail": [
    {
      "concern_type": "pores",
      "severity": "moderate",
      "confidence": 0.8,
      "affected_areas": ["nose", "cheeks"]
    }
  ],
  "recommendations": [
    "Use a gentle cleanser twice daily",
    "Consider niacinamide for pore refinement"
  ],
  "notes": "Overall healthy skin with minor concerns"
}
```

**Configuration:**
- Model: `gpt-4o` (configurable via `OPENAI_MODEL`)
- Timeout: 60 seconds (configurable via `OPENAI_TIMEOUT_SECONDS`)
- API Base: `https://api.openai.com/v1`

**File:** `backend/app/services/openai_vision_service.py`

---

### 2. MediaPipe Skin Analysis (Secondary/Local)

Local processing using MediaPipe for face detection and basic skin analysis.

**Capabilities:**
- Face detection and landmark extraction (468 points)
- Skin tone classification (very_light, light, medium, medium_dark, dark)
- Texture quality analysis (0-1 score)
- Acne detection (none, mild, moderate, severe)
- Wrinkle detection
- Dark circle detection
- Skin type classification (normal, dry, oily, combination)

**When Used:**
- Fallback when OpenAI API is unavailable
- Quick local analysis before API call
- Face validation before uploading

**File:** `backend/services/skin_analysis_service.py`

---

### 3. ML Product Suitability (Rule-Based)

Matches products to user skin profiles.

**Features:**
- Ingredient analysis against user sensitivities
- Skin type compatibility scoring
- Concern alignment matching

**Current State:** Rule-based foundation, ready for ML model integration.

**File:** `backend/app/services/ml_service.py`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SKIN ANALYSIS PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   [User Uploads Selfie]                                                  │
│           │                                                              │
│           ▼                                                              │
│   ┌───────────────────┐                                                  │
│   │  Face Detection   │  ← MediaPipe (local)                            │
│   │  & Validation     │    - Is there a face?                           │
│   └─────────┬─────────┘    - Face quality check                         │
│             │                                                            │
│             ▼                                                            │
│   ┌───────────────────┐                                                  │
│   │   OpenAI Vision   │  ← GPT-4o (cloud)                               │
│   │   Skin Analysis   │    - 10 skin signals                            │
│   │                   │    - Skin type                                   │
│   │                   │    - Detailed concerns                          │
│   └─────────┬─────────┘    - Recommendations                            │
│             │                                                            │
│             ▼                                                            │
│   ┌───────────────────┐                                                  │
│   │  Product Matching │  ← ML Service                                   │
│   │  & Recommendations│    - Match to products                          │
│   └─────────┬─────────┘    - Ingredient warnings                        │
│             │                                                            │
│             ▼                                                            │
│   ┌───────────────────┐                                                  │
│   │   Store Results   │  ← PostgreSQL                                   │
│   │   in Database     │    - Scan history                               │
│   └─────────┬─────────┘    - Digital Twin updates                       │
│             │                                                            │
│             ▼                                                            │
│   [Return Analysis to User]                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for Vision | Required |
| `OPENAI_MODEL` | Model to use | `gpt-4o` |
| `OPENAI_TIMEOUT_SECONDS` | API timeout | `60` |
| `OPENAI_API_BASE` | API base URL | `https://api.openai.com/v1` |

---

## Cost Estimation

| Operation | Cost | Notes |
|-----------|------|-------|
| OpenAI Vision API | ~$0.01-0.03/scan | Depends on image size |
| MediaPipe | $0 | Local processing |
| Product Matching | $0 | Rule-based logic |

**Monthly Estimate (1,000 scans):** ~$10-30

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/scan` | POST | Upload and analyze skin photo |
| `/api/v1/scan/{id}` | GET | Get scan results |
| `/api/v1/scan/{id}/image` | GET | Get original scan image |

---

## Future Enhancements

1. **Custom ML Models** - Train models on skin condition datasets
2. **Progress Tracking AI** - Compare scans over time
3. **Real-time Analysis** - WebSocket for live camera analysis
4. **Ingredient Scanner** - Analyze product ingredients via photo

---

## Related Files

- `backend/app/services/openai_vision_service.py` - OpenAI Vision client
- `backend/services/skin_analysis_service.py` - MediaPipe analysis
- `backend/app/services/ml_service.py` - Product suitability
- `backend/app/api/v1/endpoints/scan.py` - Scan API endpoints

---

**End of Document**
