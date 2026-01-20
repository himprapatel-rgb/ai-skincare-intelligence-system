# AI Skincare Analysis API

> Comprehensive skin analysis and product recommendations

## Table of Contents
- [Overview](#overview)
- [Skin Analysis](#skin-analysis)
- [Skin Concerns Detection](#skin-concerns-detection)
- [Product Recommendations](#product-recommendations)
- [Common Specifications](#common-specifications)

---

## Overview

The AI Skincare APIs provide comprehensive skin analysis including condition assessment, concern detection, and personalized product recommendations.

**Base URL:** `https://yce-api-01.makeupar.com`

---

## Skin Analysis

Comprehensive skin condition analysis.

### Endpoint

```
POST /api/skinanalysispro/v2
```

### Request Headers

| Header | Value |
|--------|-------|
| Content-Type | multipart/form-data |
| Authorization | Bearer YOUR_API_KEY |

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's skincare selfie |
| analysisDepth | string | No | "basic", "standard", "comprehensive" |
| includeScores | boolean | No | Include numerical scores |
| compareBaseline | file | No | Previous photo for comparison |

### Analysis Metrics

| Metric | Range | Description |
|--------|-------|-------------|
| overallScore | 0-100 | Overall skin health score |
| skinAge | years | Estimated skin age |
| hydrationLevel | 0-100 | Skin hydration percentage |
| oilLevel | 0-100 | Sebum production level |
| elasticity | 0-100 | Skin firmness/elasticity |
| evenness | 0-100 | Skin tone uniformity |
| radiance | 0-100 | Skin glow/luminosity |
| texture | 0-100 | Smoothness score |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "overallScore": 72,
    "skinAge": 28,
    "skinType": "combination",
    "metrics": {
      "hydrationLevel": 65,
      "oilLevel": 55,
      "elasticity": 78,
      "evenness": 70,
      "radiance": 68,
      "texture": 75
    },
    "zones": {
      "forehead": {"oilLevel": 70},
      "nose": {"oilLevel": 80},
      "cheeks": {"hydrationLevel": 60},
      "chin": {"oilLevel": 65}
    }
  }
}
```

---

## Skin Concerns Detection

Detect specific skin concerns.

### Endpoint

```
POST /api/skinconcernspro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie |
| concerns | array | No | Specific concerns to detect |
| sensitivity | string | No | Detection sensitivity |
| includeLocations | boolean | No | Return concern locations |

### Detectable Concerns

| Concern | Description |
|---------|-------------|
| acne | Active breakouts, pimples |
| darkSpots | Hyperpigmentation, sun spots |
| wrinkles | Fine lines and wrinkles |
| darkCircles | Under-eye darkness |
| pores | Enlarged/visible pores |
| redness | Rosacea, irritation |
| dryPatches | Dry, flaky areas |
| oiliness | Excess sebum |
| unevenTone | Skin discoloration |
| sagging | Loss of firmness |
| eyeBags | Puffiness under eyes |
| dullness | Lack of radiance |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "concernsDetected": [
      {
        "type": "darkCircles",
        "severity": "moderate",
        "score": 45,
        "location": "under-eye"
      },
      {
        "type": "pores",
        "severity": "mild",
        "score": 30,
        "location": "t-zone"
      }
    ],
    "primaryConcerns": ["darkCircles", "pores"],
    "skinCondition": "good"
  }
}
```

---

## Product Recommendations

Get personalized product recommendations.

### Endpoint

```
POST /api/skinrecommendpro/v2
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| selfie | file | Yes | User's selfie |
| skinAnalysisId | string | No | Previous analysis ID |
| productCategories | array | No | Filter by category |
| priceRange | string | No | "budget", "mid", "luxury" |
| ingredients | object | No | Prefer/avoid ingredients |

### Product Categories

| Category | Products |
|----------|----------|
| cleanser | Face wash, cleansing balm |
| toner | Toner, essence |
| serum | Treatment serums |
| moisturizer | Day/night cream |
| sunscreen | SPF protection |
| treatment | Masks, spot treatments |
| eyeCare | Eye cream, serum |

### Response

```json
{
  "resultCode": "0",
  "resultMsg": "success",
  "result": {
    "routine": {
      "morning": ["cleanser", "toner", "serum", "moisturizer", "sunscreen"],
      "evening": ["cleanser", "toner", "treatment", "serum", "moisturizer"]
    },
    "keyIngredients": ["hyaluronic acid", "niacinamide", "vitamin C"],
    "avoidIngredients": ["alcohol", "fragrance"],
    "focusAreas": ["hydration", "brightening"]
  }
}
```

---

## Common Specifications

### Supported Formats

| Feature | Max Dimensions | File Size | Formats |
|---------|----------------|-----------|----------|
| All Skincare | 4096px (long side) | 10MB | jpg, jpeg, png, heic |

### Image Requirements

- Clean, makeup-free skin preferred
- Good, natural lighting
- Front-facing selfie
- Face fully visible
- High resolution for detail

### Common Error Codes

| Code | Description |
|------|-------------|
| RUNTIME_ERROR | Unexpected runtime error |
| PHOTO_DETECTION_FAIL | Photo could not be processed |
| FACE_NOT_DETECTED | No face found in image |
| POOR_IMAGE_QUALITY | Image too blurry or dark |
| MAKEUP_DETECTED | Heavy makeup affecting analysis |

---

[← Back to Index](./README.md)
